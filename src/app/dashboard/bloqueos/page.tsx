"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Bloqueo = { id: string; fecha_inicio: string; fecha_fin: string; motivo: string | null };

export default function BloqueosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("bloqueos").select("id, fecha_inicio, fecha_fin, motivo").eq("barberia_id", id).order("fecha_inicio", { ascending: false });
    if (error) setError(error.message);
    setBloqueos(data || []);
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

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId || !fechaInicio) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("bloqueos").insert({
      barberia_id: barberiaId,
      fecha_inicio: `${fechaInicio}T00:00:00-03:00`,
      fecha_fin: `${fechaFin || fechaInicio}T23:59:59-03:00`,
      todo_el_dia: true,
      motivo: motivo.trim() || "Día bloqueado",
    });
    if (error) setError(error.message);
    else {
      setFechaInicio("");
      setFechaFin("");
      setMotivo("");
      await load(barberiaId);
    }
    setSaving(false);
  };

  const eliminar = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    await supabase.from("bloqueos").delete().eq("id", id);
    await load(barberiaId);
  };

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

        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Bloqueos</h1>

        <form onSubmit={guardar} className="rounded-2xl p-4 mb-6 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Feriado, vacaciones..." className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button disabled={saving} className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>
            {saving ? "Guardando..." : "Bloquear"}
          </button>
        </form>

        {bloqueos.map((b) => {
          const desde = new Date(b.fecha_inicio).toLocaleDateString("es-UY");
          const hasta = new Date(b.fecha_fin).toLocaleDateString("es-UY");
          return (
            <div key={b.id} className="rounded-2xl p-4 mb-3 flex justify-between" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <div>
                <p className="font-medium">{desde === hasta ? desde : `${desde} → ${hasta}`}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{b.motivo}</p>
              </div>
              <button onClick={() => eliminar(b.id)} className="text-sm text-red-500">Quitar</button>
            </div>
          );
        })}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
        <div className="max-w-md mx-auto grid grid-cols-4 text-center text-xs py-3">
          <Link href="/dashboard" style={{ color: "var(--muted)" }}>Agenda</Link>
          <Link href="/dashboard/clientes" style={{ color: "var(--muted)" }}>Clientes</Link>
          <span className="font-medium">Bloqueos</span>
          <Link href="/reservar" style={{ color: "var(--muted)" }}>Reservar</Link>
        </div>
      </nav>
    </main>
  );
}
