"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
type Horario = { id: string; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean };

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data, error } = await supabase.from("horario_semanal").select("id, dia_semana, hora_inicio, hora_fin, activo").order("dia_semana");
      if (error) setError(error.message);
      setHorarios((data || []).map((h) => ({
        ...h,
        hora_inicio: String(h.hora_inicio).slice(0, 5),
        hora_fin: String(h.hora_fin).slice(0, 5),
      })));
    };
    load();
  }, [router]);

  const guardar = async (h: Horario) => {
    const supabase = createClient();
    const { error } = await supabase.from("horario_semanal").update({
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      activo: h.activo,
    }).eq("id", h.id);
    if (error) setError(error.message);
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Horarios</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {horarios.map((h) => (
          <div key={h.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium mb-2">{dias[h.dia_semana]}</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={h.hora_inicio} onChange={(e) => setHorarios((prev) => prev.map((x) => x.id === h.id ? { ...x, hora_inicio: e.target.value } : x))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
              <input type="time" value={h.hora_fin} onChange={(e) => setHorarios((prev) => prev.map((x) => x.id === h.id ? { ...x, hora_fin: e.target.value } : x))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            </div>
            <label className="flex items-center gap-2 text-sm mt-3">
              <input type="checkbox" checked={h.activo} onChange={(e) => setHorarios((prev) => prev.map((x) => x.id === h.id ? { ...x, activo: e.target.checked } : x))} />
              Abierto
            </label>
            <button onClick={() => guardar(h)} className="mt-3 w-full rounded-xl py-2 text-sm" style={{ background: "#1d1d1f", color: "#fff" }}>Guardar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
