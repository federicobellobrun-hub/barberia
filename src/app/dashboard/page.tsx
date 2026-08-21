"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

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
  window.open(`https://wa.me/${waNumber(telefono)}?text=${encodeURIComponent(texto)}`, "_blank");
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("usuarios").select("nombre").eq("auth_user_id", user.id).single();
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
      const mes = fecha.slice(0, 7);
      const inicioMes = new Date(`${mes}-01T00:00:00-03:00`).toISOString();
      const siguiente = new Date(`${mes}-01T00:00:00-03:00`);
      siguiente.setMonth(siguiente.getMonth() + 1);

      const [turnosRes, manianaRes, pagosMesRes] = await Promise.all([
        supabase
          .from("turnos")
          .select("id, barberia_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo)")
          .gte("fecha_hora", desde)
          .lte("fecha_hora", hasta)
          .neq("estado", "cancelado")
          .order("fecha_hora"),
        supabase
          .from("turnos")
          .select("id, barberia_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo)")
          .gte("fecha_hora", new Date(`${diaManiana}T00:00:00-03:00`).toISOString())
          .lte("fecha_hora", new Date(`${diaManiana}T23:59:59-03:00`).toISOString())
          .neq("estado", "cancelado")
          .order("fecha_hora"),
        supabase.from("pagos").select("monto").gte("pagado_at", inicioMes).lt("pagado_at", siguiente.toISOString()),
      ]);

      if (turnosRes.error) setError(turnosRes.error.message);
      setTurnos((turnosRes.data as any) || []);
      setManiana((manianaRes.data as any) || []);
      setTotalMes((pagosMesRes.data || []).reduce((acc: number, p: { monto: number }) => acc + Number(p.monto || 0), 0));
      setLoading(false);
    };
    load();
  }, [fecha]);

  const pendientes = useMemo(() => turnos.filter((t) => t.estado === "pendiente"), [turnos]);
  const totalDia = useMemo(() => turnos.reduce((acc, t) => acc + Number(one(t.pagos)?.monto || 0), 0), [turnos]);

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
      .insert({ barberia_id: turno.barberia_id, turno_id: turno.id, monto, metodo })
      .select("id, monto, metodo")
      .single();
    if (error) return setError(error.message);
    await supabase.from("turnos").update({ estado: "realizado" }).eq("id", turno.id);
    setTurnos((prev) => prev.map((t) => (t.id === turno.id ? { ...t, pagos: data, estado: "realizado" } : t)));
    setTotalMes((n) => n + monto);
  };

  const moverTurno = async (turno: Turno) => {
    if (!nuevaFecha || !nuevaHora) return;
    const supabase = createClient();
    const fechaHora = new Date(`${nuevaFecha}T${nuevaHora}:00-03:00`).toISOString();
    const { error } = await supabase.from("turnos").update({ fecha_hora: fechaHora, estado: "confirmado" }).eq("id", turno.id);
    if (error) return setError(error.message);
    const cliente = one(turno.clientes);
    const servicio = one(turno.servicios);
    if (cliente?.telefono) {
      abrirWhatsapp(
        cliente.telefono,
        `Hola ${cliente.nombre}, te reagendamos el turno.\n\nServicio: ${servicio?.nombre}\nNuevo día: ${nuevaFecha}\nNueva hora: ${nuevaHora}`
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

  const Card = ({ t, recordatorio = false }: { t: Turno; recordatorio?: boolean }) => {
    const cliente = one(t.clientes);
    const servicio = one(t.servicios);
    const pago = one(t.pagos);
    return (
      <article className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xl font-semibold">{horaUy(t.fecha_hora)}</p>
            <p className="font-medium mt-1">{cliente?.nombre || "Cliente"}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {servicio?.nombre} · ${servicio?.precio || 0}
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{cliente?.telefono}</p>
          </div>
          <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            {t.estado}
          </span>
        </div>

        {cliente?.telefono && (
          <div className="flex flex-wrap gap-2 mt-4">
            {!recordatorio && (
              <button
                onClick={() => {
                  cambiarEstado(t.id, "confirmado");
                  abrirWhatsapp(
                    cliente.telefono,
                    `Hola ${cliente.nombre}, te confirmamos el turno.\n\nServicio: ${servicio?.nombre}\nDía: ${fechaUy(t.fecha_hora)}\nHora: ${horaUy(t.fecha_hora)}`
                  );
                }}
                className="text-xs px-4 py-2 rounded-full font-medium"
                style={{ background: "#1d1d1f", color: "#fff" }}
              >
                Confirmar y avisar
              </button>
            )}
            <button
              onClick={() =>
                abrirWhatsapp(
                  cliente.telefono,
                  `Hola ${cliente.nombre}, te recordamos tu turno${recordatorio ? " de mañana" : ""}.\n\n${servicio?.nombre}\n${fechaUy(t.fecha_hora)} · ${horaUy(t.fecha_hora)}`
                )
              }
              className="text-xs px-4 py-2 rounded-full"
              style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
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
                  className="text-xs px-4 py-2 rounded-full"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  Mover
                </button>
                <button
                  onClick={() => cambiarEstado(t.id, "no_asistio")}
                  className="text-xs px-4 py-2 rounded-full"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  No vino
                </button>
                <button
                  onClick={() => {
                    cambiarEstado(t.id, "cancelado");
                    abrirWhatsapp(
                      cliente.telefono,
                      `Hola ${cliente.nombre}, tu turno del ${fechaUy(t.fecha_hora)} a las ${horaUy(t.fecha_hora)} fue cancelado.`
                    );
                  }}
                  className="text-xs px-4 py-2 rounded-full text-red-500"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}

        {editId === t.id && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <button onClick={() => moverTurno(t)} className="col-span-2 rounded-xl py-2 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>
              Guardar y avisar
            </button>
          </div>
        )}

        {!recordatorio && (
          pago ? (
            <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>Pagado · {pago.metodo} · ${pago.monto}</p>
          ) : (
            <div className="flex gap-2 mt-3">
              <button onClick={() => registrarPago(t, "efectivo")} className="text-xs px-4 py-2 rounded-full" style={{ border: "1px solid var(--line)" }}>Efectivo</button>
              <button onClick={() => registrarPago(t, "transferencia")} className="text-xs px-4 py-2 rounded-full" style={{ border: "1px solid var(--line)" }}>Transferencia</button>
            </div>
          )
        )}
      </article>
    );
  };

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <button onClick={handleLogout} className="text-sm" style={{ color: "var(--muted)" }}>Salir</button>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>Barbershop</p>
          </div>
          <ThemeToggle />
        </header>

        <p className="text-sm" style={{ color: "var(--muted)" }}>Hola, {nombre}</p>
        <h1 className="text-[34px] font-semibold tracking-tight leading-9 mb-5">Agenda</h1>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link href="/dashboard/clientes" className="rounded-2xl p-4 text-center text-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>Clientes</Link>
          <Link href="/dashboard/bloqueos" className="rounded-2xl p-4 text-center text-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>Bloqueos</Link>
          <Link href="/dashboard/catalogo" className="rounded-2xl p-4 text-center text-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>Catálogo</Link>
          <Link href="/dashboard/mas" className="rounded-2xl p-4 text-center text-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>Más</Link>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            ["Pendientes", pendientes.length],
            ["Hoy", turnos.length],
            ["Día", `$${totalDia}`],
            ["Mes", `$${totalMes}`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
              <p className="text-2xl font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {maniana.length > 0 && (
          <section className="mb-8">
            <h2 className="font-medium mb-3">Recordatorios de mañana</h2>
            {maniana.map((t) => <Card key={t.id} t={t} recordatorio />)}
          </section>
        )}

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setFecha(addDays(fecha, -1))} className="h-9 w-9 rounded-full" style={{ border: "1px solid var(--line)" }}>‹</button>
          <div className="text-center">
            <p className="font-medium capitalize">{labelFecha}</p>
            <button onClick={() => setFecha(ymd(new Date()))} className="text-xs" style={{ color: "var(--muted)" }}>Hoy</button>
          </div>
          <button onClick={() => setFecha(addDays(fecha, 1))} className="h-9 w-9 rounded-full" style={{ border: "1px solid var(--line)" }}>›</button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {loading && <p style={{ color: "var(--muted)" }}>Cargando...</p>}
        {!loading && turnos.length === 0 && <p style={{ color: "var(--muted)" }}>No hay turnos este día.</p>}
        {turnos.map((t) => <Card key={t.id} t={t} />)}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
        <div className="max-w-md mx-auto grid grid-cols-4 text-center text-xs py-3">
          <span className="font-medium">Agenda</span>
          <Link href="/dashboard/clientes" style={{ color: "var(--muted)" }}>Clientes</Link>
          <Link href="/dashboard/catalogo" style={{ color: "var(--muted)" }}>Catálogo</Link>
          <Link href="/dashboard/mas" style={{ color: "var(--muted)" }}>Más</Link>
        </div>
      </nav>
    </main>
  );
}
