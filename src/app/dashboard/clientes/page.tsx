"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Cliente = { id: string; nombre: string; telefono: string; cortes: number; sin_cortesia: boolean };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fidelizacion, setFidelizacion] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).single();
    if (!u?.barberia_id) return;
    const [{ data: shop }, { data: c, error: cErr }, { data: t }] = await Promise.all([
      supabase.from("barberias").select("fidelizacion").eq("id", u.barberia_id).single(),
      supabase.from("clientes").select("id, nombre, telefono, sin_cortesia").eq("barberia_id", u.barberia_id).order("nombre"),
      supabase.from("turnos").select("cliente_id").eq("barberia_id", u.barberia_id).eq("estado", "realizado"),
    ]);
    if (cErr) setError(cErr.message);
    setFidelizacion(shop?.fidelizacion !== false);
    const cortes: Record<string, number> = {};
    (t || []).forEach((x: { cliente_id: string }) => {
      cortes[x.cliente_id] = (cortes[x.cliente_id] || 0) + 1;
    });
    setClientes((c || []).map((x) => ({ ...x, cortes: cortes[x.id] || 0, sin_cortesia: !!x.sin_cortesia })));
  };

  useEffect(() => {
    load();
  }, [router]);

  const toggleCortesia = async (c: Cliente) => {
    const supabase = createClient();
    const { error } = await supabase.from("clientes").update({ sin_cortesia: !c.sin_cortesia }).eq("id", c.id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Clientes</h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          {fidelizacion ? "Cortesía cada 10 cortes. Podés sacarla cliente por cliente." : "La cortesía está apagada en Configuración."}
        </p>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="w-full rounded-2xl px-4 py-3 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
        {clientes
          .filter((c) => c.nombre.toLowerCase().includes(q.toLowerCase()) || c.telefono.includes(q))
          .map((c) => {
            const toca = fidelizacion && c.cortes > 0 && c.cortes % 10 === 0 && !c.sin_cortesia;
            return (
              <div key={c.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                <Link href={`/dashboard/clientes/${c.id}`}>
                  <div className="flex justify-between">
                    <p className="font-medium">{c.nombre}</p>
                    {toca && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#1c1712", color: "#f4efe6" }}>Cortesía</span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{c.telefono} · {c.cortes} cortes</p>
                </Link>
                {fidelizacion && c.cortes > 0 && c.cortes % 10 === 0 && (
                  <button onClick={() => toggleCortesia(c)} className="text-sm mt-2">
                    {c.sin_cortesia ? "Activar cortesía" : "No aplicar cortesía"}
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </main>
  );
}
