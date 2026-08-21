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
  const router = useRouter();

  const load = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("fotos")
      .select("id, url, mostrar_inicio")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setFotos(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      await load();
    };
    init();
  }, [router]);

  const toggle = async (f: Foto) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("fotos")
      .update({ mostrar_inicio: !f.mostrar_inicio })
      .eq("id", f.id);
    if (error) setError(error.message);
    else await load();
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar esta foto?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("fotos").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Galería</h1>
        <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
          Fotos que se ven en la pantalla principal
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <img src={f.url} alt="" className="h-36 w-full object-cover" />
              <div className="p-2 space-y-2">
                <button
                  onClick={() => toggle(f)}
                  className="w-full rounded-xl py-2 text-xs"
                  style={{ background: f.mostrar_inicio === false ? "var(--bg)" : "#1d1d1f", color: f.mostrar_inicio === false ? "var(--text)" : "#fff" }}
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
