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

export default function DashboardPage() {
  const [nombre, setNombre] = useState("Barbero");
  const [fecha, setFecha] = useState(ymd(new Date()));
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const inicioMesSiguiente = new Date(
        `${mes}-01T00:00:00-03:00`
      );
      inicioMesSiguiente.setMonth(inicioMesSiguiente.getMonth() + 1);

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
          .lt("pagado_at", inicioMesSiguiente.toISOString()),
      ]);

      if (turnosRes.error) setError(turnosRes.error.message);
      if (pagosMesRes.error) setError(pagosMesRes.error.message);

      setTurnos((turnosRes.data as any) || []);
      const sumaMes = (pagosMesRes.data || []).reduce(
        (acc: number, p: { monto: number }) => acc + Number(p.monto || 0),
        0
      );
      setTotalMes(sumaMes);
      setLoading(false);
    };

    load();
  }, [fecha]);

  const totalDia = useMemo(() => {
    return turnos.reduce((acc, t) => {
      const pago = one(t.pagos);
      return acc + Number(pago?.monto || 0);
    }, 0);
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
    const servicio = one(turno.servicios);
    const monto = Number(servicio?.precio || 0);

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

    setTurnos((prev) =>
      prev.map((t) => (t.id === turno.id ? { ...t, pagos: data, estado: "realizado" } : t))
    );
    await supabase.from("turnos").update({ estado: "realizado" }).eq("id", turno.id);
    setTotalMes((n) => n + monto);
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
        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white">
          Salir
        </button>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-8 space-y-6">
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
            const hora = new Date(t.fecha_hora).toLocaleTimeString("es-UY", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Montevideo",
            });

            return (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-amber-500 font-semibold">{hora}</p>
                    <p className="text-lg font-medium">{cliente?.nombre || "Cliente"}</p>
                    <p className="text-sm text-zinc-400">
                      {servicio?.nombre} · {t.duracion_minutos} min · ${servicio?.precio || 0}
                    </p>
                    <p className="text-sm text-zinc-500">{cliente?.telefono}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-zinc-400">
                    {t.estado}
                  </span>
                </div>

                <div className="mt-4">
                  {pago ? (
                    <p className="text-sm text-green-400">
                      Pagado · {pago.metodo} · ${pago.monto}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => registrarPago(t, "efectivo")}
                        className="text-xs px-3 py-2 rounded-lg bg-amber-500 text-black font-semibold"
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

                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => cambiarEstado(t.id, "confirmado")} className="text-xs px-3 py-2 rounded-lg bg-zinc-800">
                    Confirmado
                  </button>
                  <button onClick={() => cambiarEstado(t.id, "realizado")} className="text-xs px-3 py-2 rounded-lg bg-zinc-800">
                    Realizado
                  </button>
                  <button onClick={() => cambiarEstado(t.id, "no_asistio")} className="text-xs px-3 py-2 rounded-lg bg-zinc-800">
                    No asistió
                  </button>
                  <button onClick={() => cambiarEstado(t.id, "cancelado")} className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400">
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
