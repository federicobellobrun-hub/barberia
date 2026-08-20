"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Persona = { nombre: string; telefono: string };
type Servicio = { nombre: string; precio: number };
type Pago = { id: string; monto: number; metodo: string };

type Turno = {
  id: string;
  barberia_id: string;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string;
  clientes: Persona | Persona[] | null;
  servicios: Servicio | Servicio[] | null;
  pagos: Pago | Pago[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function ymd(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}

function addDays(value: string, days: number) {
  const d = new Date(`${value}T12:00:00-03:00`);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function horaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });
}

function fechaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Montevideo",
  });
}

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

function abrirWhatsapp(telefono: string, texto: string) {
  const url = `https://wa.me/${waNumber(telefono)}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

export default function DashboardPage() {
  const [nombre, setNombre] = useState("Barbero");
  const [fecha, setFecha] = useState(ymd(new Date()));
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("auth_user_id", user.id)
        .single();
      if (data?.nombre) setNombre(data.nombre);
    };
    loadUser();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      const mes = fecha.slice(0, 7);
      const inicioMes = new Date(`${mes}-01T00:00:00-03:00`).toISOString();
      const siguiente = new Date(`${mes}-01T00:00:00-03:00`);
      siguiente.setMonth(siguiente.getMonth() + 1);

      const [turnosRes, pagosMesRes] = await Promise.all([
        supabase
          .from("turnos")
          .select(
            "id, barberia_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo)"
          )
          .gte("fecha_hora", desde)
          .lte("fecha_hora", hasta)
          .neq("estado", "cancelado")
          .order("fecha_hora"),
        supabase
          .from("pagos")
          .select("monto")
          .gte("pagado_at", inicioMes)
          .lt("pagado_at", siguiente.toISOString()),
      ]);

      if (turnosRes.error) setError(turnosRes.error.message);
      setTurnos((turnosRes.data as any) || []);
      setTotalMes(
        (pagosMesRes.data || []).reduce(
          (acc: number, p: { monto: number }) => acc + Number(p.monto || 0),
          0
        )
      );
      setLoading(false);
    };
    load();
  }, [fecha]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("nuevas-reservas")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "turnos" },
        async (payload: any) => {
          const turno = payload.new;
          let texto = "Entró un turno nuevo";

          if (turno?.cliente_id) {
            const { data } = await supabase
              .from("clientes")
              .select("nombre")
              .eq("id", turno.cliente_id)
              .single();
            if (data?.nombre) {
              const hora = new Date(turno.fecha_hora).toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Montevideo",
              });
              texto = `${data.nombre} reservó a las ${hora}`;
            }
          }

          setAviso(texto);

          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Nueva reserva", { body: texto });
            }
          }

          const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
          audio.play().catch(() => {});

          setTimeout(() => window.location.reload(), 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalDia = useMemo(() => {
    return turnos.reduce((acc, t) => acc + Number(one(t.pagos)?.monto || 0), 0);
  }, [turnos]);

  const cambiarEstado = async (id: string, estado: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTurnos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
  };

  const registrarPago = async (turno: Turno, metodo: "efectivo" | "transferencia") => {
    const supabase = createClient();
    const monto = Number(one(turno.servicios)?.precio || 0);
    const { data, error } = await supabase
      .from("pagos")
      .insert({
        barberia_id: turno.barberia_id,
        turno_id: turno.id,
        monto,
        metodo,
      })
      .select("id, monto, metodo")
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    await supabase.from("turnos").update({ estado: "realizado" }).eq("id", turno.id);
    setTurnos((prev) =>
      prev.map((t) => (t.id === turno.id ? { ...t, pagos: data, estado: "realizado" } : t))
    );
    setTotalMes((n) => n + monto);
  };

  const moverTurno = async (turno: Turno) => {
    if (!nuevaFecha || !nuevaHora) return;
    const supabase = createClient();
    const fechaHora = new Date(`${nuevaFecha}T${nuevaHora}:00-03:00`).toISOString();
    const { error } = await supabase
      .from("turnos")
      .update({ fecha_hora: fechaHora, estado: "confirmado" })
      .eq("id", turno.id);
    if (error) {
      setError(error.message);
      return;
    }

    const cliente = one(turno.clientes);
    const servicio = one(turno.servicios);
    if (cliente?.telefono) {
      abrirWhatsapp(
        cliente.telefono,
        `Hola ${cliente.nombre}, te reagendamos el turno.\n\nServicio: ${servicio?.nombre}\nNuevo día: ${nuevaFecha}\nNueva hora: ${nuevaHora}\n\nSi no podés, avisanos.`
      );
    }

    setEditId(null);
    setFecha(nuevaFecha);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const labelFecha = new Date(`${fecha}T12:00:00-03:00`).toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-500">Agenda</h1>
        <div className="flex items-center gap-4">
          <a href="/dashboard/clientes" className="text-sm text-zinc-400 hover:text-white">
            Clientes
          </a>
          <a href="/dashboard/recordatorios" className="text-sm text-zinc-400 hover:text-white">
            Mañana
          </a>
          <a href="/dashboard/bloqueos" className="text-sm text-zinc-400 hover:text-white">
            Bloqueos
          </a>
          <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white">
            Salir
          </button>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {aviso && (
          <div className="bg-amber-500 text-black font-semibold rounded-xl p-4">
            {aviso}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => {
              if ("Notification" in window) {
                Notification.requestPermission();
              }
            }}
            className="text-sm bg-zinc-800 px-3 py-2 rounded-lg"
          >
            Activar avisos
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-400">Ingresos del día</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">${totalDia}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-400">Ingresos del mes</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">${totalMes}</p>
            <p className="text-xs text-zinc-500">{nombre}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setFecha(addDays(fecha, -1))}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800"
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-semibold capitalize">{labelFecha}</p>
            <button onClick={() => setFecha(ymd(new Date()))} className="text-xs text-amber-500">
              Hoy
            </button>
          </div>
          <button
            onClick={() => setFecha(addDays(fecha, 1))}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800"
          >
            →
          </button>
        </div>

        {error && (
          <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}
        {loading && <p className="text-zinc-500">Cargando turnos...</p>}
        {!loading && turnos.length === 0 && (
          <p className="text-zinc-500">No hay turnos para este día.</p>
        )}

        <div className="space-y-3">
          {turnos.map((t) => {
            const cliente = one(t.clientes);
            const servicio = one(t.servicios);
            const pago = one(t.pagos);

            return (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-amber-500 font-semibold">{horaUy(t.fecha_hora)}</p>
                    <p className="text-lg font-medium">{cliente?.nombre || "Cliente"}</p>
                    <p className="text-sm text-zinc-400">
                      {servicio?.nombre} · {t.duracion_minutos} min · ${servicio?.precio || 0}
                    </p>
                    <p className="text-sm text-zinc-500">{cliente?.telefono}</p>
                  </div>
                  <span className="text-xs uppercase text-zinc-400">{t.estado}</span>
                </div>

                {cliente?.telefono && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        cambiarEstado(t.id, "confirmado");
                        abrirWhatsapp(
                          cliente.telefono,
                          `Hola ${cliente.nombre}, te confirmamos el turno.\n\nServicio: ${servicio?.nombre}\nDía: ${fechaUy(t.fecha_hora)}\nHora: ${horaUy(t.fecha_hora)}\n\nTe esperamos.`
                        );
                      }}
                      className="text-xs px-3 py-2 rounded-lg bg-amber-500 text-black font-semibold"
                    >
                      Confirmar y avisar
                    </button>
                    <button
                      onClick={() =>
                        abrirWhatsapp(
                          cliente.telefono,
                          `Hola ${cliente.nombre}, te recordamos tu turno de mañana.\n\nServicio: ${servicio?.nombre}\nDía: ${fechaUy(t.fecha_hora)}\nHora: ${horaUy(t.fecha_hora)}\n\nSi no podés venir, avisanos.`
                        )
                      }
                      className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                    >
                      Recordatorio
                    </button>
                    <button
                      onClick={() => {
                        setEditId(t.id);
                        setNuevaFecha(ymd(new Date(t.fecha_hora)));
                        setNuevaHora(horaUy(t.fecha_hora));
                      }}
                      className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                    >
                      Mover horario
                    </button>
                    <button
                      onClick={() => {
                        cambiarEstado(t.id, "cancelado");
                        abrirWhatsapp(
                          cliente.telefono,
                          `Hola ${cliente.nombre}, tu turno del ${fechaUy(t.fecha_hora)} a las ${horaUy(t.fecha_hora)} fue cancelado.\n\nSi querés, podés reservar otro horario.`
                        );
                      }}
                      className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400"
                    >
                      Cancelar y avisar
                    </button>
                  </div>
                )}

                {editId === t.id && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                    />
                    <input
                      type="time"
                      value={nuevaHora}
                      onChange={(e) => setNuevaHora(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={() => moverTurno(t)}
                      className="col-span-2 bg-amber-500 text-black font-semibold py-2 rounded-lg"
                    >
                      Guardar y avisar
                    </button>
                  </div>
                )}

                {pago ? (
                  <p className="text-sm text-green-400">
                    Pagado · {pago.metodo} · ${pago.monto}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => registrarPago(t, "efectivo")}
                      className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                    >
                      Pagó efectivo
                    </button>
                    <button
                      onClick={() => registrarPago(t, "transferencia")}
                      className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                    >
                      Pagó transferencia
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
