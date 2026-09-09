"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Foto = { id: string; url: string; mostrar_inicio: boolean | null };

export default function GaleriaPage() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const router = useRouter();

  const load = async (shopId: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("fotos")
      .select("id, url, mostrar_inicio")
      .eq("barberia_id", shopId)
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    setFotos(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: yo } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!yo?.barberia_id) {
        setError("Este usuario no tiene local");
        return;
      }
      setBarberiaId(yo.barberia_id);
      await load(yo.barberia_id);
    };
    void init();
  }, [router]);

  const subir = async (file: File) => {
    if (!barberiaId) return;
    setError(null);
    setMsg("");
    setSubiendo(true);
    const supabase = createClient();
    const path = `${barberiaId}/galeria/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) {
      setSubiendo(false);
      return setError(upErr.message);
    }
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error: e } = await supabase.from("fotos").insert({
      barberia_id: barberiaId,
      url: data.publicUrl,
      mostrar_inicio: true,
    });
    setSubiendo(false);
    if (e) setError(e.message);
    else {
      setMsg("Foto subida");
      await load(barberiaId);
    }
  };

  const toggle = async (f: Foto) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error: e } = await supabase.from("fotos").update({ mostrar_inicio: !f.mostrar_inicio }).eq("id", f.id).eq("barberia_id", barberiaId);
    if (e) setError(e.message);
    else await load(barberiaId);
  };

  const borrar = async (id: string) => {
    if (!barberiaId || !confirm("¿Borrar esta foto?")) return;
    const supabase = createClient();
    const { error: e } = await supabase.from("fotos").delete().eq("id", id).eq("barberia_id", barberiaId);
    if (e) setError(e.message);
    else await load(barberiaId);
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Galería</h1>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Fotos del local en la pantalla principal
        </p>

        <label className="mb-6 block rounded-2xl p-4 text-center text-sm cursor-pointer" style={{ background: "var(--card)", border: "1px dashed var(--line)" }}>
          {subiendo ? "Subiendo..." : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={subiendo || !barberiaId}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void subir(file);
              e.target.value = "";
            }}
          />
        </label>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {msg && <p className="text-sm mb-4">{msg}</p>}
        {fotos.length === 0 && !error && <p className="text-sm" style={{ color: "var(--muted)" }}>Este local todavía no tiene fotos.</p>}

        <div className="grid grid-cols-2 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <img src={f.url} alt="" className="h-36 w-full object-cover" />
              <div className="p-2 space-y-2">
                <button
                  onClick={() => toggle(f)}
                  className="w-full rounded-xl py-2 text-xs"
                  style={{
                    background: f.mostrar_inicio === false ? "var(--bg)" : "#1c1712",
                    color: f.mostrar_inicio === false ? "var(--text)" : "#f4efe6",
                  }}
                >
                  {f.mostrar_inicio === false ? "Oculta" : "En inicio"}
                </button>
                <button onClick={() => borrar(f.id)} className="w-full text-xs text-red-500">
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
