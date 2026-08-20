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
  window.open(
    `https://wa.me/${waNumber(telefono)}?text=${encodeURIComponent(texto)}`,
    "_blank"
  );
}

function badge(estado: string) {
  if (estado === "confirmado") return "bg-emerald-500/15 text-emerald-400";
  if (estado === "realizado") return "bg-amber-500/15 text-amber-400";
  if (estado === "no_asistio") return "bg-zinc-700 text-zinc-300";
  return "bg-sky-500/15 text-sky-300";
}

export default function DashboardPage() {
  const [nombre, setNombre] = useState("Barbero");
  const [fecha, setFecha] = useState(ymd(new Date()));
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [maniana, setManiana] = useState<Turno[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const diaManiana = addDays(ymd(new Date()), 1);
      const manianaDesde = new Date(`${diaManiana}T00:00:00-03:00`).toISOString();
      const manianaHasta = new Date(`${diaManiana}T23:59:59-03:00`).toISOString();
      const mes = fecha.slice(0, 7);
      const inicioMes = new Date(`${mes}-01T00:00:00-03:00`).toISOString();
      const siguiente = new Date(`${mes}-01T00:00:00-03:00`);
      siguiente.setMonth(siguiente.getMonth() + 1);

      const [turnosRes, manianaRes, pagosMesRes] = await Promise.all([
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
          .from("turnos")
          .select(
            "id, barberia_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo)"
          )
          .gte("fecha_hora", manianaDesde)
          .lte("fecha_hora", manianaHasta)
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
      setManiana((manianaRes.data as any) || []);
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

  const pendientes = useMemo(
    () => turnos.filter((t) => t.estado === "pendiente"),
    [turnos]
  );
  const totalDia = useMemo(
    () => turnos.reduce((acc, t) => acc + Number(one(t.pagos)?.monto || 0), 0),
    [turnos]
  );

  const cambiarEstado = async (id: string, estado: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (error) return setError(error.message);
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
    if (error) return setError(error.message);
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
    if (error) return setError(error.message);
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

  const CardTurno = ({ t, recordatorio = false }: { t: Turno; recordatorio?: boolean }) => {
    const cliente = one(t.clientes);
    const servicio = one(t.servicios);
    const pago = one(t.pagos);

    return (
      <article className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 shadow-[0_10px_40px_rgba(0,0,0,.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-amber-400 text-2xl font-semibold tracking-tight">
              {horaUy(t.fecha_hora)}
            </p>
            <p className="mt-1 text-lg font-medium">{cliente?.nombre || "Cliente"}</p>
            <p className="text-sm text-zinc-400">
              {servicio?.nombre} · {t.duracion_minutos} min · ${servicio?.precio || 0}
            </p>
            <p className="text-sm text-zinc-500">{cliente?.telefono}</p>
          </div>
          <span className={`text-[11px] uppercase tracking-[0.18em] px-3 py-1 rounded-full ${badge(t.estado)}`}>
            {t.estado}
          </span>
        </div>

        {cliente?.telefono && (
          <div className="mt-5 flex flex-wrap gap-2">
            {!recordatorio && (
              <button
                onClick={() => {
                  cambiarEstado(t.id, "confirmado");
                  abrirWhatsapp(
                    cliente.telefono,
                    `Hola ${cliente.nombre}, te confirmamos el turno.\n\nServicio: ${servicio?.nombre}\nDía: ${fechaUy(t.fecha_hora)}\nHora: ${horaUy(t.fecha_hora)}\n\nTe esperamos.`
                  );
                }}
                className="text-xs px-4 py-2 rounded-full bg-amber-500 text-black font-semibold"
              >
                Confirmar y avisar
              </button>
            )}
            <button
              onClick={() =>
                abrirWhatsapp(
                  cliente.telefono,
                  `Hola ${cliente.nombre}, te recordamos tu turno${recordatorio ? " de mañana" : ""}.\n\nServicio: ${servicio?.nombre}\nDía: ${fechaUy(t.fecha_hora)}\nHora: ${horaUy(t.fecha_hora)}\n\nSi no podés venir, avisanos.`
                )
              }
              className="text-xs px-4 py-2 rounded-full bg-zinc-800 text-zinc-200"
            >
              {recordatorio ? "Enviar recordatorio" : "Recordatorio"}
            </button>
            {!recordatorio && (
              <>
                <button
                  onClick={() => {
                    setEditId(t.id);
                    setNuevaFecha(ymd(new Date(t.fecha_hora)));
                    setNuevaHora(horaUy(t.fecha_hora));
                  }}
                  className="text-xs px-4 py-2 rounded-full bg-zinc-800"
                >
                  Mover
                </button>
                <button
                  onClick={() => {
                    cambiarEstado(t.id, "cancelado");
                    abrirWhatsapp(
                      cliente.telefono,
                      `Hola ${cliente.nombre}, tu turno del ${fechaUy(t.fecha_hora)} a las ${horaUy(t.fecha_hora)} fue cancelado.\n\nSi querés, reservá otro horario.`
                    );
                  }}
                  className="text-xs px-4 py-2 rounded-full bg-red-500/10 text-red-400"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}

        {editId === t.id && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2"
            />
            <input
              type="time"
              value={nuevaHora}
              onChange={(e) => setNuevaHora(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2"
            />
            <button
              onClick={() => moverTurno(t)}
              className="col-span-2 bg-amber-500 text-black font-semibold py-2 rounded-xl"
            >
              Guardar y avisar
            </button>
          </div>
        )}

        {!recordatorio &&
          (pago ? (
            <p className="mt-4 text-sm text-emerald-400">
              Pagado · {pago.metodo} · ${pago.monto}
            </p>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => registrarPago(t, "efectivo")}
                className="text-xs px-4 py-2 rounded-full bg-zinc-800"
              >
                Efectivo
              </button>
              <button
                onClick={() => registrarPago(t, "transferencia")}
                className="text-xs px-4 py-2 rounded-full bg-zinc-800"
              >
                Transferencia
              </button>
            </div>
          ))}
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1408_0%,#09090b_45%)]">
      <header className="border-b border-zinc-800/80 px-6 py-4 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-500/80">
              Panel premium
            </p>
            <h1 className="text-xl font-semibold">Agenda</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm text-zinc-400">
            <a href="/dashboard/clientes" className="hover:text-white">
              Clientes
            </a>
            <a href="/dashboard/bloqueos" className="hover:text-white">
              Bloqueos
            </a>
            <span className="text-zinc-600">|</span>
            <span>{nombre}</span>
            <button onClick={handleLogout} className="hover:text-white">
              Salir
            </button>
          </nav>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Pendientes", pendientes.length],
            ["Turnos hoy", turnos.length],
            ["Día", `$${totalDia}`],
            ["Mes", `$${totalMes}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-semibold text-amber-400 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {maniana.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-500">Día anterior</p>
              <h2 className="text-xl font-semibold">Recordatorios de mañana</h2>
            </div>
            {maniana.map((t) => (
              <CardTurno key={t.id} t={t} recordatorio />
            ))}
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setFecha(addDays(fecha, -1))}
              className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900"
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
              className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900"
            >
              →
            </button>
          </div>

          {error && (
            <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              {error}
            </p>
          )}
          {loading && <p className="text-zinc-500">Cargando agenda...</p>}
          {!loading && turnos.length === 0 && (
            <p className="text-zinc-500">No hay turnos para este día.</p>
          )}

          {pendientes.length > 0 && (
            <p className="text-sm text-amber-400">
              Tenés {pendientes.length} reserva{pendientes.length > 1 ? "s" : ""} para confirmar.
            </p>
          )}

          {turnos.map((t) => (
            <CardTurno key={t.id} t={t} />
          ))}
        </section>
      </section>
    </main>
  );
}
