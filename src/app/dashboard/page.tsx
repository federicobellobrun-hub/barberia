"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";

type Persona = { nombre: string; telefono: string };
type Servicio = { nombre: string; precio: number };
type Pago = { id: string; monto: number; metodo: string };
type Barbero = { id: string; nombre: string };
type Turno = {
  id: string;
  barberia_id: string;
  barbero_id: string | null;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string;
  clientes: Persona | Persona[] | null;
  servicios: Servicio | Servicio[] | null;
  pagos: Pago | Pago[] | null;
  barberos: Barbero | Barbero[] | null;
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
    month: "short",
    timeZone: "America/Montevideo",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fecha, setFecha] = useState(ymd(new Date()));
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [esBarbero, setEsBarbero] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const { data: me } = await supabase
        .from("usuarios")
        .select("barberia_id, rol, barbero_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      if (!me?.barberia_id) {
        setError("Sin barbería");
        setLoading(false);
        return;
      }
      const soloBarbero = me.rol === "barbero";
      setEsBarbero(soloBarbero);

      const { data: bars } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", me.barberia_id).order("nombre");
      setBarberos((bars as Barbero[]) || []);

      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      let q = supabase
        .from("turnos")
        .select("id, barberia_id, barbero_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo), barberos(id, nombre)")
        .eq("barberia_id", me.barberia_id)
        .gte("fecha_hora", desde)
        .lte("fecha_hora", hasta)
        .order("fecha_hora");
      if (soloBarbero && me.barbero_id) q = q.eq("barbero_id", me.barbero_id);
      const { data, error: e } = await q;
      if (e) setError(e.message);
      setTurnos((data as unknown as Turno[]) || []);
      setLoading(false);
    };
    void load();
  }, [fecha, router, supabase]);

  const turnosFiltrados = useMemo(() => {
    if (filtroBarbero === "todos") return turnos;
    return turnos.filter((t) => t.barbero_id === filtroBarbero);
  }, [turnos, filtroBarbero]);

  const labelFecha = fechaUy(`${fecha}T12:00:00-03:00`);

  return (
    <main className="min-h-screen px-4 pb-24 pt-4">
      <BrandHeader left={<span className="font-medium">Agenda</span>} />
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setFecha(addDays(fecha, -1))} className="h-9 w-9 rounded-full" style={{ border: "1px solid var(--line)" }}>
          ‹
        </button>
        <div className="text-center">
          <p className="font-medium capitalize">{labelFecha}</p>
          <button onClick={() => setFecha(ymd(new Date()))} className="text-xs" style={{ color: "var(--muted)" }}>
            Hoy
          </button>
        </div>
        <button onClick={() => setFecha(addDays(fecha, 1))} className="h-9 w-9 rounded-full" style={{ border: "1px solid var(--line)" }}>
          ›
        </button>
      </div>

      {!esBarbero && barberos.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroBarbero("todos")}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm"
            style={{
              background: filtroBarbero === "todos" ? "var(--fg, #1A1612)" : "var(--card)",
              color: filtroBarbero === "todos" ? "var(--bg, #F6F1E8)" : "inherit",
            }}
          >
            Todos
          </button>
          {barberos.map((b) => (
            <button
              key={b.id}
              onClick={() => setFiltroBarbero(b.id)}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm"
              style={{
                background: filtroBarbero === b.id ? "var(--fg, #1A1612)" : "var(--card)",
                color: filtroBarbero === b.id ? "var(--bg, #F6F1E8)" : "inherit",
              }}
            >
              {b.nombre}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {loading && <p style={{ color: "var(--muted)" }}>Cargando...</p>}
      {!loading && turnosFiltrados.length === 0 && <p style={{ color: "var(--muted)" }}>No hay turnos este día.</p>}
      {turnosFiltrados.map((t) => {
        const c = one(t.clientes);
        const s = one(t.servicios);
        const b = one(t.barberos);
        return (
          <article key={t.id} className="mb-3 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {horaUy(t.fecha_hora)} · {c?.nombre || "Cliente"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {s?.nombre || "Servicio"}
                  {b?.nombre ? ` · ${b.nombre}` : ""}
                </p>
              </div>
              <span className="text-[11px] uppercase">{t.estado}</span>
            </div>
          </article>
        );
      })}

      <BottomNav
        items={
          esBarbero
            ? [
                { href: "/dashboard", label: "Agenda", active: true },
                { href: "/dashboard/nuevo", label: "Nuevo" },
                { href: "/dashboard/mas", label: "Más" },
              ]
            : [
                { href: "/dashboard", label: "Agenda", active: true },
                { href: "/dashboard/clientes", label: "Clientes" },
                { href: "/dashboard/catalogo", label: "Catálogo" },
                { href: "/dashboard/mas", label: "Más" },
              ]
        }
      />
    </main>
  );
}
