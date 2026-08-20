"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  notas: string | null;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre, telefono, notas")
        .order("nombre");
      if (error) setError(error.message);
      setClientes(data || []);
    };
    load();
  }, [router]);

  const filtrados = clientes.filter((c) => {
    const t = q.toLowerCase();
    return c.nombre.toLowerCase().includes(t) || c.telefono.includes(q);
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1408_0%,#09090b_45%)]">
      <header className="border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-500/80">Clientes</p>
            <h1 className="text-xl font-semibold">Fichas</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            Agenda
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50"
        />

        {error && <p className="text-red-400">{error}</p>}

        <div className="grid gap-3">
          {filtrados.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/clientes/${c.id}`}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 hover:border-amber-500/40 transition"
            >
              <p className="text-lg font-medium">{c.nombre}</p>
              <p className="text-sm text-zinc-400">{c.telefono}</p>
              {c.notas && <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{c.notas}</p>}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
