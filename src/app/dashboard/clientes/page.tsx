"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Cliente = { id: string; nombre: string; telefono: string; notas: string | null };

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
      const { data, error } = await supabase.from("clientes").select("id, nombre, telefono, notas").order("nombre");
      if (error) setError(error.message);
      setClientes(data || []);
    };
    load();
  }, [router]);

  const filtrados = clientes.filter((c) => c.nombre.toLowerCase().includes(q.toLowerCase()) || c.telefono.includes(q));

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard">‹</Link>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>Barbershop</p>
          </div>
          <ThemeToggle />
        </header>

        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Clientes</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar"
          className="w-full rounded-2xl px-4 py-3 mb-4 outline-none"
          style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {filtrados.map((c) => (
          <Link key={c.id} href={`/dashboard/clientes/${c.id}`} className="block rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{c.nombre}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{c.telefono}</p>
          </Link>
        ))}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
        <div className="max-w-md mx-auto grid grid-cols-4 text-center text-xs py-3">
          <Link href="/dashboard" style={{ color: "var(--muted)" }}>Agenda</Link>
          <span className="font-medium">Clientes</span>
          <Link href="/dashboard/bloqueos" style={{ color: "var(--muted)" }}>Bloqueos</Link>
          <Link href="/reservar" style={{ color: "var(--muted)" }}>Reservar</Link>
        </div>
      </nav>
    </main>
  );
}
