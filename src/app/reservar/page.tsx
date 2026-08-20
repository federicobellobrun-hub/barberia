"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Servicio = {
  id: string;
  barberia_id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
};
type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };
type Bloqueo = { fecha_inicio: string; fecha_fin: string; todo_el_dia: boolean };
type Turno = { fecha_hora: string; duracion_minutos: number };

function ymdMontevideo(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}
function weekdayMontevideo(date: Date) {
  const wd = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Montevideo" });
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? date.getDay();
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function IconScissors() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.2 7.6 20 18M8.2 16.4 20 6" />
    </svg>
  );
}
function IconRazor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 8h12M7 8v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8M16 6l4 4" />
    </svg>
  );
}
function IconComb() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 4v16M9 4v16M13 4v16M17 4v16M5 4h12M5 20h12" />
    </svg>
  );
}
function iconoDe(nombre: string) {
  const n = nombre.toLowerCase();
  if (n.includes("barba") && n.includes("corte")) return <IconComb />;
  if (n.includes("barba")) return <IconRazor />;
  return <IconScissors />;
}

export default function ReservarPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const desde = new Date();
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 40);
        const [servRes, horRes, bloqRes, turRes] = await Promise.all([
          supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos, precio").eq("activo", true).order("orden"),
          supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin").eq("activo", true),
          supabase.from("bloqueos").select("fecha_inicio, fecha_fin, todo_el_dia"),
          supabase.from("turnos").select("fecha_hora, duracion_minutos").in("estado", ["pendiente", "confirmado", "realizado"]).gte("fecha_hora", desde.toISOString()).lte("fecha_hora", hasta.toISOString()),
        ]);
        if (servRes.error) throw new Error(servRes.error.message);
        setServicios(servRes.data || []);
        setHorarios(horRes.data || []);
        setBloqueos(bloqRes.data || []);
        setTurnos(turRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const celdasMes = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      cells.push(ymdMontevideo(new Date(year, month, d)));
    }
    return cells;
  }, [mes]);

  const horariosDelDia = useMemo(() => {
    if (!servicio || !fecha) return [];
    const date = new Date(`${fecha}T12:00:00-03:00`);
    const horario = horarios.find((h) => Number(h.dia_semana) === weekdayMontevideo(date));
    if (!horario) return [];
    const dayStart = new Date(`${fecha}T00:00:00-03:00`);
    const dayEnd = new Date(`${fecha}T23:59:59-03:00`);
    if (bloqueos.some((b) => b.todo_el_dia && new Date(b.fecha_inicio) <= dayEnd && new Date(b.fecha_fin) >= dayStart)) return [];
    const start = toMinutes(horario.hora_inicio);
    const end = toMinutes(horario.hora_fin);
    const dur = servicio.duracion_minutos;
    const slots: string[] = [];
    for (let t = start; t + dur <= end; t += 30) {
      const hhmm = fromMinutes(t);
      const slotStart = new Date(`${fecha}T${hhmm}:00-03:00`);
      const slotEnd = new Date(slotStart.getTime() + dur * 60000);
      const chocaBloqueo = bloqueos.some((b) => !b.todo_el_dia && new Date(b.fecha_inicio) < slotEnd && new Date(b.fecha_fin) > slotStart);
      const chocaTurno = turnos.some((turno) => {
        const ini = new Date(turno.fecha_hora);
        return ini < slotEnd && new Date(ini.getTime() + turno.duracion_minutos * 60000) > slotStart;
      });
      if (chocaBloqueo || chocaTurno) continue;
      if (slotStart.getTime() < Date.now() + 30 * 60000) continue;
      slots.push(hhmm);
    }
    return slots;
  }, [servicio, fecha, horarios, bloqueos, turnos]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicio || !fecha || !hora) return;
    setEnviando(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("crear_reserva", {
        p_barberia_id: servicio.barberia_id,
        p_servicio_id: servicio.id,
        p_nombre: nombre.trim(),
        p_telefono: telefono.trim(),
        p_fecha_hora: new Date(`${fecha}T${hora}:00-03:00`).toISOString(),
        p_duracion_minutos: servicio.duracion_minutos,
      });
      if (error) throw new Error(error.message);
      fetch("/api/whatsapp/confirmacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, nombre: nombre.trim(), servicio: servicio.nombre, fecha, hora }),
      }).catch(() => {});
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar");
    } finally {
      setEnviando(false);
    }
  };

  const hoy = ymdMontevideo(new Date());
  const mesLabel = mes.toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted)" }}>Cargando...</main>;
  }

  if (ok && servicio) {
    return (
      <main className="min-h-screen px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Turno reservado</h1>
        <p className="mt-4" style={{ color: "var(--muted)" }}>{servicio.nombre} · {fecha} · {hora}</p>
        <Link href="/" className="inline-block mt-8" style={{ color: "var(--accent)" }}>Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="text-xl leading-none">☰</Link>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Gentlemen's</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>Barbershop</p>
          </div>
          <ThemeToggle />
        </header>

        <h1 className="text-[34px] font-semibold tracking-tight leading-9">Reservá tu turno</h1>
        <p className="mt-2 mb-5" style={{ color: "var(--muted)" }}>Elegí servicio, día y hora</p>

        <div className="rounded-2xl p-4 mb-6 flex gap-3 items-start" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "#eee4d4" }}>📅</div>
          <div>
            <p className="font-medium text-sm">Reserva rápida</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Elegí servicio y horario. Sin pago online.</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Elegí un servicio</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-7">
          {servicios.map((s) => {
            const activo = servicio?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setServicio(s); setHora(""); }}
                className="rounded-2xl p-3 text-left min-h-[132px]"
                style={{
                  background: activo ? "#f3eee6" : "var(--card)",
                  border: activo ? "1.5px solid #cfc3b0" : "1px solid var(--line)",
                  color: "var(--text)",
                }}
              >
                <div className="flex justify-between items-start mb-6">{iconoDe(s.nombre)}{activo && <span className="text-xs">✓</span>}</div>
                <p className="text-sm font-medium leading-4">{s.nombre}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>${s.precio}</p>
              </button>
            );
          })}
        </div>

        <h2 className="font-medium mb-3">Elegí día y hora</h2>
        <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
            <p className="text-sm font-medium capitalize">{mesLabel}</p>
            <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] mb-2" style={{ color: "var(--muted)" }}>
            {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
            {celdasMes.map((value, i) => {
              if (!value) return <span key={i} />;
              const activo = fecha === value;
              const pasado = value < hoy;
              return (
                <button
                  key={value}
                  disabled={pasado}
                  onClick={() => { setFecha(value); setHora(""); }}
                  className="h-8 w-8 mx-auto rounded-full"
                  style={{
                    background: activo ? "#1d1d1f" : "transparent",
                    color: activo ? "#fff" : pasado ? "var(--line)" : "var(--text)",
                  }}
                >
                  {Number(value.slice(8))}
                </button>
              );
            })}
          </div>
        </div>

        {fecha && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {horariosDelDia.length === 0 && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>No hay horarios ese día.</p>
            )}
            {horariosDelDia.map((h) => {
              const activo = hora === h;
              return (
                <button
                  key={h}
                  onClick={() => setHora(h)}
                  className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: activo ? "#1d1d1f" : "var(--card)",
                    color: activo ? "#fff" : "var(--text)",
                    border: activo ? "none" : "1px solid var(--line)",
                  }}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}

        <h2 className="font-medium mb-3">Resumen</h2>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="px-4 py-3 flex justify-between text-sm border-b" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: "var(--muted)" }}>Servicio</span>
            <span>{servicio?.nombre || "—"}</span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm border-b" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: "var(--muted)" }}>Día y hora</span>
            <span>{fecha && hora ? `${fecha} · ${hora}` : "—"}</span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm font-medium">
            <span>Total</span>
            <span>${servicio?.precio || 0}</span>
          </div>
        </div>

        {servicio && fecha && hora && (
          <form onSubmit={guardar} className="space-y-3 mb-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="w-full rounded-2xl px-4 py-3 outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}
            />
            <input
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="WhatsApp"
              className="w-full rounded-2xl px-4 py-3 outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}
            />
            <button
              disabled={enviando}
              className="w-full rounded-2xl py-4 font-medium disabled:opacity-50"
              style={{ background: "#1d1d1f", color: "#fff" }}
            >
              {enviando ? "Reservando..." : "Confirmar reserva  →"}
            </button>
          </form>
        )}
        <p className="text-center text-xs mb-6" style={{ color: "var(--muted)" }}>Gratis reservar · Sin pago online</p>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
        <div className="max-w-md mx-auto grid grid-cols-3 text-center text-xs py-3">
          <Link href="/" style={{ color: "var(--muted)" }}>Inicio</Link>
          <span className="font-medium">Reservar</span>
          <Link href="/login" style={{ color: "var(--muted)" }}>Panel</Link>
        </div>
      </nav>
    </main>
  );
}
