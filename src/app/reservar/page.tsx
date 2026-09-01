"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = {
  id: string;
  barberia_id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  imagen_url: string | null;
};
type Barbero = { id: string; nombre: string; foto_url: string | null };
type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string; barbero_id?: string | null };
type Bloqueo = { fecha_inicio: string; fecha_fin: string; todo_el_dia: boolean };
type Turno = { fecha_hora: string; duracion_minutos: number; barbero_id: string | null };

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

export default function ReservarPage() {
  const search = useSearchParams();
  const slug = search.get("b") || (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null) || "diano";

  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [horariosLocal, setHorariosLocal] = useState<Horario[]>([]);
  const [horariosBarbero, setHorariosBarbero] = useState<Horario[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [esperaOk, setEsperaOk] = useState(false);
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    localStorage.setItem("barberia_slug", slug);
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: shop, error: shopErr } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
        if (shopErr || !shop) throw new Error("No se encontró la barbería");
        setBarberiaId(shop.id);
        const desde = new Date();
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 40);
        const [servRes, barRes, horRes, horBarRes, bloqRes, turRes] = await Promise.all([
          supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos, precio, imagen_url").eq("barberia_id", shop.id).eq("activo", true).order("orden"),
          supabase.from("barberos").select("id, nombre, foto_url").eq("barberia_id", shop.id).eq("activo", true).order("nombre"),
          supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin").eq("barberia_id", shop.id).eq("activo", true),
          supabase.from("horario_barbero").select("dia_semana, hora_inicio, hora_fin, barbero_id").eq("barberia_id", shop.id).eq("activo", true),
          supabase.from("bloqueos").select("fecha_inicio, fecha_fin, todo_el_dia").eq("barberia_id", shop.id),
          supabase.from("turnos").select("fecha_hora, duracion_minutos, barbero_id").eq("barberia_id", shop.id).in("estado", ["pendiente", "confirmado", "realizado"]).gte("fecha_hora", desde.toISOString()).lte("fecha_hora", hasta.toISOString()),
        ]);
        if (servRes.error) throw new Error(servRes.error.message);
        setServicios(servRes.data || []);
        setBarberos(barRes.data || []);
        setHorariosLocal(horRes.data || []);
        setHorariosBarbero(horBarRes.data || []);
        setBloqueos(bloqRes.data || []);
        setTurnos(turRes.data || []);
        if ((barRes.data || []).length === 1) setBarbero(barRes.data![0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const horarios = useMemo(() => {
    if (!barbero) return horariosLocal;
    const propios = horariosBarbero.filter((h) => h.barbero_id === barbero.id);
    return propios.length ? propios : horariosLocal;
  }, [barbero, horariosLocal, horariosBarbero]);

  const celdasMes = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const start = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(ymdMontevideo(new Date(year, month, d)));
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
        if (barbero && turno.barbero_id && turno.barbero_id !== barbero.id) return false;
        const ini = new Date(turno.fecha_hora);
        return ini < slotEnd && new Date(ini.getTime() + turno.duracion_minutos * 60000) > slotStart;
      });
      if (chocaBloqueo || chocaTurno) continue;
      if (slotStart.getTime() < Date.now() + 30 * 60000) continue;
      slots.push(hhmm);
    }
    return slots;
  }, [servicio, barbero, fecha, horarios, bloqueos, turnos]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicio || !fecha || !hora) return;
    if (barberos.length > 0 && !barbero) return setError("Elegí un barbero");
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
        p_barbero_id: barbero?.id || null,
      });
      if (error) throw new Error(error.message);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar");
    } finally {
      setEnviando(false);
    }
  };

  const anotarEspera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicio || !barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("lista_espera").insert({
      barberia_id: barberiaId,
      servicio_id: servicio.id,
      nombre,
      telefono,
      fecha,
    });
    if (error) setError(error.message);
    else setEsperaOk(true);
  };

  const hoy = ymdMontevideo(new Date());
  const mesLabel = mes.toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  if (loading) return <main className="min-h-screen flex items-center justify-center">Cargando...</main>;
  if (ok && servicio) {
    return (
      <main className="min-h-screen px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Turno reservado</h1>
        <p className="mt-4">{servicio.nombre}{barbero ? ` · ${barbero.nombre}` : ""} · {fecha} · {hora}</p>
        <Link href={`/b/${slug}`} className="inline-block mt-8">Volver</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        <h1 className="text-[34px] font-semibold tracking-tight leading-9">Reservá tu turno</h1>
        <p className="mt-2 mb-5" style={{ color: "var(--muted)" }}>Elegí servicio, barbero, día y hora</p>
        {error && <p className="mb-6 text-red-500 text-sm">{error}</p>}

        {servicios.length === 0 && (
          <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Esta barbería todavía no cargó servicios.</p>
        )}

        <h2 className="font-medium mb-3">Elegí un servicio</h2>
        <div className="grid grid-cols-3 gap-2 items-stretch">
          {servicios.map((s) => {
            const activo = servicio?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setServicio(s); setHora(""); }}
                className="rounded-2xl text-left overflow-hidden flex flex-col h-full"
                style={{
                  background: activo ? "#f3eee6" : "var(--card)",
                  border: activo ? "1.5px solid #cfc3b0" : "1px solid var(--line)",
                  color: "var(--text)",
                }}
              >
                {s.imagen_url ? (
                  <img src={s.imagen_url} alt="" className="h-24 w-full object-cover shrink-0" />
                ) : (
                  <div className="h-24 w-full shrink-0 flex items-center justify-center text-xl" style={{ background: "var(--bg)" }}>✂</div>
                )}
                <div className="p-3 flex-1">
                  <p className="text-sm font-medium leading-4 line-clamp-2">{s.nombre}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>${s.precio}</p>
                </div>
              </button>
            );
          })}
        </div>

        {servicio && (
          <div className="rounded-2xl p-4 mt-3 mb-6" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Servicio elegido</p>
            <p className="font-medium">{servicio.nombre}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{servicio.duracion_minutos} min · ${servicio.precio}</p>
          </div>
        )}

        {barberos.length > 0 && (
          <>
            <h2 className="font-medium mb-3">Elegí barbero</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {barberos.map((b) => {
                const activoSel = barbero?.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => { setBarbero(b); setHora(""); }}
                    className="shrink-0 rounded-2xl p-3 w-28 text-center"
                    style={{
                      background: activoSel ? "#f3eee6" : "var(--card)",
                      border: activoSel ? "1.5px solid #cfc3b0" : "1px solid var(--line)",
                    }}
                  >
                    {b.foto_url ? (
                      <img src={b.foto_url} alt="" className="h-14 w-14 object-cover rounded-full mx-auto mb-2" />
                    ) : (
                      <div className="h-14 w-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--bg)" }}>
                        {b.nombre.slice(0, 1)}
                      </div>
                    )}
                    <p className="text-sm font-medium leading-4">{b.nombre}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

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
              const activoDia = fecha === value;
              const pasado = value < hoy;
              return (
                <button
                  key={value}
                  disabled={pasado}
                  onClick={() => { setFecha(value); setHora(""); setEsperaOk(false); }}
                  className="h-8 w-8 mx-auto rounded-full"
                  style={{
                    background: activoDia ? "#1c1712" : "transparent",
                    color: activoDia ? "#fff" : pasado ? "var(--line)" : "var(--text)",
                  }}
                >
                  {Number(value.slice(8))}
                </button>
              );
            })}
          </div>
        </div>

        {fecha && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {horariosDelDia.map((h) => (
                <button
                  key={h}
                  onClick={() => setHora(h)}
                  className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: hora === h ? "#1c1712" : "var(--card)",
                    color: hora === h ? "#fff" : "var(--text)",
                    border: hora === h ? "none" : "1px solid var(--line)",
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
            {horariosDelDia.length === 0 && (
              <div className="mt-3">
                <p className="text-sm mb-3">No hay horarios ese día.</p>
                {esperaOk ? <p className="text-sm">Quedaste en lista de espera.</p> : (
                  <form onSubmit={anotarEspera} className="space-y-2">
                    <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
                    <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
                    <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>Anotarme en lista de espera</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {servicio && fecha && hora && (
          <form onSubmit={guardar} className="space-y-3 mb-4">
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <button disabled={enviando} className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
              {enviando ? "Reservando..." : "Confirmar reserva  →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
