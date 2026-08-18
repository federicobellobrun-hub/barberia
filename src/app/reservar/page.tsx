"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type Servicio = {
  id: string;
  barberia_id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
};

type Horario = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

type Bloqueo = {
  fecha_inicio: string;
  fecha_fin: string;
  todo_el_dia: boolean;
};

type Turno = {
  fecha_hora: string;
  duracion_minutos: number;
};

function ymdMontevideo(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}

function weekdayMontevideo(date: Date) {
  const wd = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Montevideo",
  });
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? date.getDay();
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ReservarPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const desde = new Date();
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 16);

        const [servRes, horRes, bloqRes, turRes] = await Promise.all([
          supabase
            .from("servicios")
            .select("id, barberia_id, nombre, duracion_minutos, precio")
            .eq("activo", true)
            .order("orden"),
          supabase
            .from("horario_semanal")
            .select("dia_semana, hora_inicio, hora_fin")
            .eq("activo", true),
          supabase
            .from("bloqueos")
            .select("fecha_inicio, fecha_fin, todo_el_dia"),
          supabase
            .from("turnos")
            .select("fecha_hora, duracion_minutos")
            .in("estado", ["pendiente", "confirmado", "realizado"])
            .gte("fecha_hora", desde.toISOString())
            .lte("fecha_hora", hasta.toISOString()),
        ]);

        if (servRes.error) throw new Error(servRes.error.message);
        if (horRes.error) throw new Error(horRes.error.message);
        if (bloqRes.error) throw new Error(bloqRes.error.message);
        if (turRes.error) throw new Error(turRes.error.message);

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

  const proximosDias = useMemo(() => {
    const days: { value: string; label: string; date: Date }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const value = ymdMontevideo(d);
      const label = d.toLocaleDateString("es-UY", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "America/Montevideo",
      });
      days.push({ value, label, date: d });
    }
    return days;
  }, []);

  const horariosDelDia = useMemo(() => {
    if (!servicio || !fecha) return [];

    const date = new Date(`${fecha}T12:00:00-03:00`);
    const dow = weekdayMontevideo(date);
    const horario = horarios.find((h) => h.dia_semana === dow);
    if (!horario) return [];

    const dayStart = new Date(`${fecha}T00:00:00-03:00`);
    const dayEnd = new Date(`${fecha}T23:59:59-03:00`);

    const bloqueadoTodoElDia = bloqueos.some((b) => {
      const ini = new Date(b.fecha_inicio);
      const fin = new Date(b.fecha_fin);
      return b.todo_el_dia && ini <= dayEnd && fin >= dayStart;
    });
    if (bloqueadoTodoElDia) return [];

    const start = toMinutes(horario.hora_inicio);
    const end = toMinutes(horario.hora_fin);
    const dur = servicio.duracion_minutos;
    const slots: string[] = [];

    for (let t = start; t + dur <= end; t += 15) {
      const hhmm = fromMinutes(t);
      const slotStart = new Date(`${fecha}T${hhmm}:00-03:00`);
      const slotEnd = new Date(slotStart.getTime() + dur * 60000);

      const chocaBloqueo = bloqueos.some((b) => {
        if (b.todo_el_dia) return false;
        const ini = new Date(b.fecha_inicio);
        const fin = new Date(b.fecha_fin);
        return ini < slotEnd && fin > slotStart;
      });
      if (chocaBloqueo) continue;

      const chocaTurno = turnos.some((turno) => {
        const ini = new Date(turno.fecha_hora);
        const fin = new Date(ini.getTime() + turno.duracion_minutos * 60000);
        return ini < slotEnd && fin > slotStart;
      });
      if (chocaTurno) continue;

      if (i === 0 && slotStart.getTime() < Date.now() + 30 * 60000) continue;

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
      const fechaHora = new Date(`${fecha}T${hora}:00-03:00`).toISOString();

      const { error } = await supabase.rpc("crear_reserva", {
        p_barberia_id: servicio.barberia_id,
        p_servicio_id: servicio.id,
        p_nombre: nombre.trim(),
        p_telefono: telefono.trim(),
        p_fecha_hora: fechaHora,
        p_duracion_minutos: servicio.duracion_minutos,
      });

      if (error) throw new Error(error.message);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-zinc-400">
        Cargando...
      </main>
    );
  }

  if (ok && servicio) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-amber-500">¡Turno reservado!</h1>
          <p className="text-zinc-300">
            {servicio.nombre} el {fecha} a las {hora}
          </p>
          <p className="text-zinc-400 text-sm">
            Te esperamos. Más adelante te va a llegar el aviso por WhatsApp.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 text-black font-semibold px-5 py-3 rounded-lg"
          >
            Reservar otro
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-md mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">Reservar turno</h1>
          <p className="text-zinc-400 mt-2">Elegí servicio, día y hora</p>
        </div>

        {error && (
          <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <section className="space-y-3">
          <h2 className="font-semibold">1. Servicio</h2>
          {servicios.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicio(s);
                setHora("");
              }}
              className={`w-full text-left p-4 rounded-2xl border ${
                servicio?.id === s.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <p className="font-semibold">{s.nombre}</p>
              <p className="text-sm text-zinc-400">
                {s.duracion_minutos} min · ${s.precio}
              </p>
            </button>
          ))}
        </section>

        {servicio && (
          <section className="space-y-3">
            <h2 className="font-semibold">2. Día</h2>
            <div className="grid grid-cols-2 gap-2">
              {proximosDias.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    setFecha(d.value);
                    setHora("");
                  }}
                  className={`p-3 rounded-xl border text-sm ${
                    fecha === d.value
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {servicio && fecha && (
          <section className="space-y-3">
            <h2 className="font-semibold">3. Hora</h2>
            {horariosDelDia.length === 0 && (
              <p className="text-zinc-500 text-sm">
                No hay horarios disponibles ese día.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {horariosDelDia.map((h) => (
                <button
                  key={h}
                  onClick={() => setHora(h)}
                  className={`p-3 rounded-xl border text-sm ${
                    hora === h
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </section>
        )}

        {servicio && fecha && hora && (
          <form onSubmit={guardar} className="space-y-4">
            <h2 className="font-semibold">4. Tus datos</h2>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
            />
            <input
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="WhatsApp. Ej: 099123456"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
            />
            <button
              disabled={enviando}
              className="w-full bg-amber-500 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
            >
              {enviando ? "Reservando..." : "Confirmar reserva"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
