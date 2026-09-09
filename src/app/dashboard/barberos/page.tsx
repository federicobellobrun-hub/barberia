"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Barbero = { id: string; nombre: string; foto_url: string | null; activo: boolean };

export default function BarberosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [rubro, setRubro] = useState("barberia");
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const rosa = rubro === "pestanas_unas";
  const titulo = rosa ? "Equipo" : "Barberos";
  const uno = rosa ? "profesional" : "barbero";

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase.from("barberos").select("id, nombre, foto_url, activo").eq("barberia_id", id).order("nombre");
    if (e) setError(e.message);
    setBarberos(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!data?.barberia_id) return;
      setBarberiaId(data.barberia_id);
      const { data: shop } = await supabase.from("barberias").select("rubro").eq("id", data.barberia_id).maybeSingle();
      setRubro(shop?.rubro || "barberia");
      await load(data.barberia_id);
    };
    void init();
  }, [router]);

  const token = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const crearAcceso = async (barberoId: string, mail: string, pass: string) => {
    const t = await token();
    const res = await fetch("/api/barberos/acceso", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ barberoId, email: mail, password: pass }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(json.error || "No se creó el acceso");
  };

  const subirFoto = async (barberoId: string, file: File, idBarberia: string) => {
    const supabase = createClient();
    const path = `${idBarberia}/barberos/${barberoId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error: e } = await supabase.from("barberos").update({ foto_url: data.publicUrl }).eq("id", barberoId);
    if (e) throw new Error(e.message);
  };

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    setError(null);
    setMsg("");
    const supabase = createClient();
    const { data, error: e1 } = await supabase
      .from("barberos")
      .insert({ barberia_id: barberiaId, nombre: nombre.trim(), activo: true })
      .select("id")
      .single();
    if (e1) return setError(e1.message);
    try {
      if (foto && data?.id) await subirFoto(data.id, foto, barberiaId);
      if (email && password && data?.id) {
        await crearAcceso(data.id, email, password);
        setMsg(`${rosa ? "Profesional" : "Barbero"} y acceso creados`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
    setNombre("");
    setEmail("");
    setPassword("");
    setFoto(null);
    setPreview(null);
    await load(barberiaId);
  };

  const accesoExistente = async (id: string) => {
    const mail = window.prompt(`Email de la ${uno}`);
    const pass = window.prompt("Contraseña (mínimo 6)");
    if (!mail || !pass) return;
    try {
      await crearAcceso(id, mail, pass);
      setMsg("Acceso creado. Ya puede entrar en /login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se creó el acceso");
    }
  };

  const cambiarFoto = async (id: string, file: File) => {
    if (!barberiaId) return;
    try {
      await subirFoto(id, file, barberiaId);
      await load(barberiaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    }
  };

  const borrar = async (id: string) => {
    if (!barberiaId) return;
    if (!window.confirm(`¿Borrar ${uno} y su acceso?`)) return;
    setError(null);
    const t = await token();
    const res = await fetch("/api/barberos/acceso", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ barberoId: id }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) setError(json.error || "No se pudo borrar");
    else await load(barberiaId);
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">{titulo}</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {msg && <p className="text-sm mb-3">{msg}</p>}

        <form onSubmit={crear} className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {preview && <img src={preview} alt="" className="h-20 w-20 object-cover rounded-full mx-auto" />}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFoto(file);
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Nombre ${rosa ? "de la profesional" : "del barbero"}`} className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opcional, para que entre)" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (opcional)" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Agregar
          </button>
        </form>

        {barberos.map((b) => (
          <div key={b.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {b.foto_url ? (
              <img src={b.foto_url} alt="" className="h-20 w-20 object-cover rounded-full mb-3" />
            ) : (
              <div className="h-20 w-20 rounded-full mb-3 flex items-center justify-center" style={{ background: "var(--bg)" }}>
                {b.nombre.slice(0, 1)}
              </div>
            )}
            <p className="font-medium mb-2">{b.nombre}</p>
            <input
              type="file"
              accept="image/*"
              className="text-sm mb-3"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void cambiarFoto(b.id, file);
              }}
            />
            <div className="flex gap-4 text-sm">
              <button type="button" onClick={() => void accesoExistente(b.id)}>
                Dar acceso
              </button>
              <button type="button" onClick={() => void borrar(b.id)} className="text-red-500">
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
