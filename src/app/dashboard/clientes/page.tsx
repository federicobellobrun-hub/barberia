"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Cliente = { id: string; nombre: string; telefono: string; cortes: number };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).single();
      if (!u?.barberia_id) return;
      const [{ data: c, error: cErr }, { data: t }] = await Promise.all([
        supabase.from("clientes").select("id, nombre, telefono").eq("barberia_id", u.barberia_id).order("nombre"),
        supabase.from("turnos").select("cliente_id").eq("barberia_id", u.barberia_id).eq("estado", "realizado"),
      ]);
      if (cErr) setError(cErr.message);
      const cortes: Record<string, number> = {};
      (t || []).forEach((x: { cliente_id: string }) => {
        cortes[x.cliente_id] = (cortes[x.cliente_id] || 0) + 1;
      });
      setClientes((c || []).map((x) => ({ ...x, cortes: cortes[x.id] || 0 })));
    };
    load();
  }, [router]);

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Clientes</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="w-full rounded-2xl px-4 py-3 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
        {clientes.filter((c) => c.nombre.toLowerCase().includes(q.toLowerCase()) || c.telefono.includes(q)).map((c) => (
          <Link key={c.id} href={`/dashboard/clientes/${c.id}`} className="block rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="flex justify-between">
              <p className="font-medium">{c.nombre}</p>
              {c.cortes > 0 && c.cortes % 10 === 0 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#1c1712", color: "#f4efe6" }}>Cortesía</span>
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{c.telefono} · {c.cortes} cortes</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
