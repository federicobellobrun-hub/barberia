"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";

type Persona = { nombre: string; telefono: string };
type Servicio = { nombre: string; precio: number };
type Barbero = { id: string; nombre: string };
type Turno = {
  id: string;
  barbero_id: string | null;
  fecha_hora: string;
  estado: string;
  clientes: Persona | Persona[] | null;
  servicios: Servicio | Servicio[] | null;
  barberos: Barbero | Barbero[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function ymd(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function mesLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString("es-UY", { month: "long", year: "numeric" });
}

function horaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });
}

function fechaCorta(fechaHora: string) {
  return new Date(fechaHora).toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Montevideo",
  });
}

const DOW = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const hoy = ymd(new Date());
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [fecha, setFecha] = useState(hoy);
  const [turnosMes, setTurnosMes] = useState<Turno[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [esBarbero, setEsBarbero] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mesPrev = () => {
    const d = new Date(y, m - 1, 1);
    setY(d.getFullYear());
    setM(d.getMonth());
  };
  const mesNext = () => {
    const d = new Date(y, m + 1, 1);
    setY(d.getFullYear());
    setM(d.getMonth());
  };

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

      const desde = new Date(y, m, 1);
      const hasta = new Date(y, m + 1, 0, 23, 59, 59);
      let q = supabase
        .from("turnos")
        .select("id, barbero_id, fecha_hora, estado, clientes(nombre, telefono), servicios(nombre, precio), barberos(id, nombre)")
        .eq("barberia_id", me.barberia_id)
        .gte("fecha_hora", desde.toISOString())
        .lte("fecha_hora", hasta.toISOString())
        .order("fecha_hora");
      if (soloBarbero && me.barbero_id) q = q.eq("barbero_id", me.barbero_id);
      const { data, error: e } = await q;
      if (e) setError(e.message);
      setTurnosMes((data as unknown as Turno[]) || []);
      setLoading(false);
    };
    void load();
  }, [y, m, router, supabase]);

  const diasConTurno = useMemo(() => {
    const set = new Set<string>();
    turnosMes.forEach((t) => {
      if (filtroBarbero !== "todos" && t.barbero_id !== filtroBarbero) return;
      set.add(ymd(new Date(t.fecha_hora)));
    });
    return set;
  }, [turnosMes, filtroBarbero]);

  const delDia = useMemo(() => {
    return turnosMes.filter((t) => {
      const okDia = ymd(new Date(t.fecha_hora)) === fecha;
      const okBar = filtroBarbero === "todos" || t.barbero_id === filtroBarbero;
      return okDia && okBar;
    });
  }, [turnosMes, fecha, filtroBarbero]);

  const celdas = useMemo(() => {
    const first = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();
    const items: Array<{ d: number | null; key: string }> = [];
    for (let i = 0; i < first; i++) items.push({ d: null, key: `e-${i}` });
    for (let d = 1; d <= last; d++) items.push({ d, key: `d-${d}` });
    return items;
  }, [y, m]);

  const cambiarEstado = async (id: string, estado: string) => {
    const { error: e } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (e) setError(e.message);
    else setTurnosMes((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-4">
      <BrandHeader left={<span className="font-medium">Agenda</span>} />

      {!esBarbero && barberos.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroBarbero("todos")}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm"
            style={{
              background: filtroBarbero === "todos" ? "#1A1612" : "var(--card, #fff)",
              color: filtroBarbero === "todos" ? "#F6F1E8" : "inherit",
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
                background: filtroBarbero === b.id ? "#1A1612" : "var(--card, #fff)",
                color: filtroBarbero === b.id ? "#F6F1E8" : "inherit",
              }}
            >
              {b.nombre}
            </button>
          ))}
        </div>
      )}

      <section className="mb-4 rounded-2xl p-4" style={{ background: "var(--card, #fff)", border: "1px solid var(--line, #e6e0d4)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="capitalize">{mesLabel(y, m)}</p>
          <div className="flex gap-2">
            <button onClick={mesPrev} className="h-8 w-8 rounded-full" style={{ border: "1px solid var(--line, #e6e0d4)" }}>
              ‹
            </button>
            <button onClick={mesNext} className="h-8 w-8 rounded-full" style={{ border: "1px solid var(--line, #e6e0d4)" }}>
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]" style={{ color: "var(--muted)" }}>
          {DOW.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {celdas.map((c) => {
            if (!c.d) return <span key={c.key} />;
            const iso = `${y}-${pad(m + 1)}-${pad(c.d)}`;
            const sel = iso === fecha;
            const con = diasConTurno.has(iso);
            const esHoy = iso === hoy;
            return (
              <button
                key={c.key}
                onClick={() => setFecha(iso)}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm"
                style={{
                  background: sel ? "#2563eb" : con ? "#dbeafe" : "transparent",
                  color: sel ? "#fff" : esHoy ? "#dc2626" : "inherit",
                  fontWeight: con || sel ? 600 : 400,
                }}
              >
                {c.d}
              </button>
            );
          })}
        </div>
      </section>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando agenda...</p>}
      {!loading && delDia.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No hay turnos el {fechaCorta(`${fecha}T12:00:00-03:00`)}.
        </p>
      )}

      {delDia.map((t) => {
        const c = one(t.clientes);
        const s = one(t.servicios);
        const b = one(t.barberos);
        const open = abierto === t.id;
        return (
          <article key={t.id} className="mb-3 overflow-hidden rounded-xl" style={{ border: "1px solid #d7d1c6", background: "#fff" }}>
            <div className="flex">
              <div className="w-2 shrink-0" style={{ background: "#111" }} />
              <div className="flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">
                    {horaUy(t.fecha_hora)} - {fechaCorta(t.fecha_hora)}
                  </p>
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                    Nº {t.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm">
                  <b>Servicio:</b> {s?.nombre || "—"}
                  {s?.precio != null ? ` $${s.precio}` : ""}
                </p>
                <p className="text-sm">
                  <b>Profesional:</b> {b?.nombre || "—"}
                </p>
                <p className="text-sm">
                  <b>Estado:</b> {t.estado}
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-sm">
                    <b>Nombre:</b> {c?.nombre || "Cliente"}
                  </p>
                  <button onClick={() => setAbierto(open ? null : t.id)} className="text-sm" style={{ color: "var(--muted)" }}>
                    {open ? "(− info)" : "(+ info)"}
                  </button>
                </div>
                {open && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "#eee" }}>
                    {c?.telefono && <p className="w-full text-xs">{c.telefono}</p>}
                    {t.estado === "pendiente" && (
                      <button onClick={() => void cambiarEstado(t.id, "confirmado")} className="rounded-full px-3 py-1.5 text-xs" style={{ background: "#111", color: "#fff" }}>
                        Confirmar
                      </button>
                    )}
                    <button onClick={() => void cambiarEstado(t.id, "realizado")} className="rounded-full px-3 py-1.5 text-xs" style={{ border: "1px solid #ddd" }}>
                      Realizado
                    </button>
                    <button onClick={() => void cambiarEstado(t.id, "no_vino")} className="rounded-full px-3 py-1.5 text-xs" style={{ border: "1px solid #ddd" }}>
                      No vino
                    </button>
                    <button onClick={() => void cambiarEstado(t.id, "cancelado")} className="rounded-full px-3 py-1.5 text-xs" style={{ border: "1px solid #ddd" }}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
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
