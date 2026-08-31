"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Barbero = { id: string; nombre: string; foto_url: string | null; activo: boolean };

export default function BarberosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("barberos").select("id, nombre, foto_url, activo").eq("barberia_id", id).order("nombre");
    if (error) setError(error.message);
    setBarberos(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).single();
      if (!data?.barberia_id) return;
      setBarberiaId(data.barberia_id);
      await load(data.barberia_id);
    };
    init();
  }, [router]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("barberos").insert({
      barberia_id: barberiaId,
      nombre: nombre.trim(),
      activo: true,
    });
    if (error) return setError(error.message);
    setNombre("");
    await load(barberiaId);
  };

  const subirFoto = async (id: string, file: File) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const path = `${barberiaId}/barberos/${id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error } = await supabase.from("barberos").update({ foto_url: data.publicUrl }).eq("id", id);
    if (error) setError(error.message);
    else await load(barberiaId);
  };

  const borrar = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("barberos").delete().eq("id", id);
    if (error) setError(error.message);
    else await load(barberiaId);
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Barberos</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <form onSubmit={crear} className="rounded-2xl p-4 mb-5 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del barbero" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>Agregar</button>
        </form>

        {barberos.map((b) => (
          <div key={b.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {b.foto_url && <img src={b.foto_url} alt="" className="h-20 w-20 object-cover rounded-full mb-3" />}
            <p className="font-medium mb-2">{b.nombre}</p>
            <input type="file" accept="image/*" className="text-sm mb-3" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) subirFoto(b.id, file);
            }} />
            <button onClick={() => borrar(b.id)} className="text-sm text-red-500">Borrar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
