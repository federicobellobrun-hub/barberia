"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Turno = {
  id: string;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string;
  clientes: { nombre: string; telefono: string } | null;
  servicios: { nombre: string; precio: number } | null;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
    const loadTurnos = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();

      const { data, error } = await supabase
        .from("turnos")
        .select("id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio)")
        .gte("fecha_hora", desde)
        .lte("fecha_hora", hasta)
        .neq("estado", "cancelado")
        .order("fecha_hora");

      if (error) setError(error.message);
      setTurnos((data as Turno[]) || []);
      setLoading(false);
    };

    loadTurnos();
  }, [fecha]);

  const cambiarEstado = async (id: string, estado: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTurnos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
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
          <span className="text-sm text-zinc-400 hidden sm:block">{nombre}</span>
          <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white">
            Salir
          </button>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setFecha(addDays(fecha, -1))}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800"
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-semibold capitalize">{labelFecha}</p>
            <button
              onClick={() => setFecha(ymd(new Date()))}
              className="text-xs text-amber-500"
            >
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
                    <p className="text-lg font-medium">{t.clientes?.nombre || "Cliente"}</p>
                    <p className="text-sm text-zinc-400">
                      {t.servicios?.nombre} · {t.duracion_minutos} min
                    </p>
                    <p className="text-sm text-zinc-500">{t.clientes?.telefono}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-zinc-400">
                    {t.estado}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => cambiarEstado(t.id, "confirmado")}
                    className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                  >
                    Confirmado
                  </button>
                  <button
                    onClick={() => cambiarEstado(t.id, "realizado")}
                    className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                  >
                    Realizado
                  </button>
                  <button
                    onClick={() => cambiarEstado(t.id, "no_asistio")}
                    className="text-xs px-3 py-2 rounded-lg bg-zinc-800"
                  >
                    No asistió
                  </button>
                  <button
                    onClick={() => cambiarEstado(t.id, "cancelado")}
                    className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400"
                  >
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
