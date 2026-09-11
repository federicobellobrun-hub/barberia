"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Bloqueo = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  todo_el_dia: boolean | null;
};

function aIsoFecha(valor: string) {
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function aHora(valor: string) {
  const v = valor.trim();
  if (!v) return "";
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export default function BloqueosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("bloqueos")
      .select("id, fecha_inicio, fecha_fin, motivo, todo_el_dia")
      .eq("barberia_id", id)
      .order("fecha_inicio", { ascending: false });
    if (e) setError(e.message);
    setBloqueos((data as Bloqueo[]) || []);
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
      await load(data.barberia_id);
    };
    void init();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const desdeDia = aIsoFecha(fechaInicio);
    if (!desdeDia) {
      setError("Fecha desde: usá 11/09/2026");
      return;
    }
    const hastaDia = fechaFin.trim() ? aIsoFecha(fechaFin) : desdeDia;
    if (!hastaDia) {
      setError("Fecha hasta: usá 11/09/2026");
      return;
    }
    const h1 = aHora(horaInicio);
    const h2 = aHora(horaFin);
    if (h1 === null || h2 === null) {
      setError("Hora: usá 14:00");
      return;
    }
    if ((h1 && !h2) || (!h1 && h2)) {
      setError("Completá las dos horas o dejá las dos vacías.");
      return;
    }
    const conHora = Boolean(h1 && h2);
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: e1 } = await supabase.from("bloqueos").insert({
      barberia_id: barberiaId,
      fecha_inicio: conHora ? `${desdeDia}T${h1}:00-03:00` : `${desdeDia}T00:00:00-03:00`,
      fecha_fin: conHora ? `${hastaDia}T${h2}:00-03:00` : `${hastaDia}T23:59:59-03:00`,
      todo_el_dia: !conHora,
      motivo: motivo.trim() || (conHora ? "Horario bloqueado" : "Día bloqueado"),
    });
    setSaving(false);
    if (e1) return setError(e1.message);
    setFechaInicio("");
    setFechaFin("");
    setHoraInicio("");
    setHoraFin("");
    setMotivo("");
    await load(barberiaId);
  };

  const eliminar = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    await supabase.from("bloqueos").delete().eq("id", id);
    await load(barberiaId);
  };

  const box: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "#EFE8DC",
    border: "1px solid #ddd4c8",
    color: "#1C1712",
    fontSize: 16,
    height: 48,
    padding: "0 14px",
  };

  return (
    <main className="min-h-screen pb-24" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Bloqueos</h1>
        <p className="text-sm mb-5" style={{ color: "#7a7268" }}>
          Día entero o solo un rango de horas
        </p>

        <form onSubmit={guardar} className="rounded-2xl p-4 mb-6 space-y-3" style={{ background: "#fff", border: "1px solid #ddd4c8" }}>
          {error && <p className="text-red-500 text-sm break-words">{error}</p>}
          <input value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} placeholder="Desde. Ej: 11/09/2026" inputMode="numeric" className="rounded-xl" style={box} />
          <input value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} placeholder="Hasta (opcional)" inputMode="numeric" className="rounded-xl" style={box} />
          <input value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} placeholder="Hora desde. Ej: 14:00" inputMode="numeric" className="rounded-xl" style={box} />
          <input value={horaFin} onChange={(e) => setHoraFin(e.target.value)} placeholder="Hora hasta. Ej: 16:00" inputMode="numeric" className="rounded-xl" style={box} />
          <p className="text-xs" style={{ color: "#7a7268" }}>
            Sin horas = bloquea el día entero
          </p>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Feriado, almuerzo, vacaciones..." className="rounded-xl" style={box} />
          <button disabled={saving} className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1C1712", color: "#F5F0E8" }}>
            {saving ? "Guardando..." : "Bloquear"}
          </button>
        </form>

        {bloqueos.map((b) => {
          const desde = new Date(b.fecha_inicio);
          const hasta = new Date(b.fecha_fin);
          const dia = desde.toLocaleDateString("es-UY");
          const rangoHora = b.todo_el_dia
            ? "Todo el día"
            : `${desde.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })} – ${hasta.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}`;
          return (
            <div key={b.id} className="rounded-2xl p-4 mb-3 flex justify-between gap-3" style={{ background: "#fff", border: "1px solid #ddd4c8" }}>
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{dia}</p>
                <p className="text-sm">{rangoHora}</p>
                <p className="text-sm break-words" style={{ color: "#7a7268" }}>{b.motivo}</p>
              </div>
              <button type="button" onClick={() => void eliminar(b.id)} className="text-sm text-red-500 shrink-0">
                Quitar
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
