"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  notas: string | null;
  fecha_nacimiento: string | null;
};

export default function ClientesPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ultimos, setUltimos] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nacimiento, setNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, notas, fecha_nacimiento")
      .eq("barberia_id", id)
      .order("nombre");
    if (error) setError(error.message);
    setClientes(data || []);

    const { data: t } = await supabase
      .from("turnos")
      .select("cliente_id, fecha_hora")
      .eq("barberia_id", id)
      .order("fecha_hora", { ascending: false });
    const map: Record<string, string> = {};
    (t || []).forEach((row: any) => {
      if (row.cliente_id && !map[row.cliente_id]) map[row.cliente_id] = row.fecha_hora;
    });
    setUltimos(map);
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
    const { error } = await supabase.from("clientes").insert({
      barberia_id: barberiaId,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      fecha_nacimiento: nacimiento || null,
    });
    if (error) return setError(error.message);
    setNombre("");
    setTelefono("");
    setNacimiento("");
    await load(barberiaId);
  };

  const mes = new Date().getMonth() + 1;
  const cumple = useMemo(
    () => clientes.filter((c) => c.fecha_nacimiento && Number(c.fecha_nacimiento.slice(5, 7)) === mes),
    [clientes]
  );
  const limite = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const inactivos = useMemo(
    () => clientes.filter((c) => !ultimos[c.id] || new Date(ultimos[c.id]).getTime() < limite),
    [clientes, ultimos]
  );
  const filtrados = clientes.filter((c) => c.nombre.toLowerCase().includes(q.toLowerCase()) || c.telefono.includes(q));

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Clientes</h1>

        <form onSubmit={crear} className="rounded-2xl p-4 mb-6 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <p className="font-medium">Nuevo cliente</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>Crear</button>
        </form>

        {cumple.length > 0 && (
          <section className="mb-6">
            <h2 className="font-medium mb-2">Cumpleaños del mes</h2>
            {cumple.map((c) => (
              <Link key={c.id} href={`/dashboard/clientes/${c.id}`} className="block rounded-2xl p-4 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                {c.nombre} · {c.fecha_nacimiento}
              </Link>
            ))}
          </section>
        )}

        {inactivos.length > 0 && (
          <section className="mb-6">
            <h2 className="font-medium mb-2">Sin venir hace 60 días</h2>
            {inactivos.map((c) => (
              <Link key={c.id} href={`/dashboard/clientes/${c.id}`} className="block rounded-2xl p-4 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                {c.nombre}
              </Link>
            ))}
          </section>
        )}

        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="w-full rounded-2xl px-4 py-3 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
        {filtrados.map((c) => (
          <Link key={c.id} href={`/dashboard/clientes/${c.id}`} className="block rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{c.nombre}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{c.telefono}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
