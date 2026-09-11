"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
function nroTurno(id: string) {
  return id.replace(/-/g, "").slice(-6).toUpperCase();
}

async function avisoCambio(turnoId: string, tipo: "cancelado" | "movido") {
  await fetch("/api/whatsapp/cambio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnoId, tipo }),
  });
}

export default function DashboardPage() {
  const [nombre, setNombre] = useState("Barbero");
  const [rol, setRol] = useState("");
  const [miBarberoId, setMiBarberoId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(ymd(new Date()));
  const [mes, setMes] = useState(() => ymd(new Date()).slice(0, 7));
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [diasConTurno, setDiasConTurno] = useState<string[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [totalMes, setTotalMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [nuevoBarbero, setNuevoBarbero] = useState("");
  const router = useRouter();
  const esBarbero = rol === "barbero";
  const hoy = ymd(new Date());

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
      const { data } = await supabase.from("usuarios").select("nombre, rol, barbero_id").eq("auth_user_id", user.id).maybeSingle();
      if (data?.nombre) setNombre(data.nombre);
      setRol(data?.rol || "");
      if (data?.rol === "barbero" && data.barbero_id) {
        setMiBarberoId(data.barbero_id);
        setFiltroBarbero(data.barbero_id);
      }
    };
    void loadUser();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      const inicioMes = new Date(`${mes}-01T00:00:00-03:00`);
      const siguiente = new Date(inicioMes);
      siguiente.setMonth(siguiente.getMonth() + 1);
      const [turnosRes, mesRes, pagosMesRes, barberosRes] = await Promise.all([
        supabase
          .from("turnos")
          .select("id, barberia_id, barbero_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo), barberos(nombre)")
          .gte("fecha_hora", desde)
          .lte("fecha_hora", hasta)
          .neq("estado", "cancelado")
          .order("fecha_hora"),
        supabase.from("turnos").select("fecha_hora, barbero_id").gte("fecha_hora", inicioMes.toISOString()).lt("fecha_hora", siguiente.toISOString()).neq("estado", "cancelado"),
        supabase.from("pagos").select("monto").gte("pagado_at", inicioMes.toISOString()).lt("pagado_at", siguiente.toISOString()),
        supabase.from("barberos").select("id, nombre").eq("activo", true).order("nombre"),
      ]);
      if (turnosRes.error) setError(turnosRes.error.message);
      setTurnos((turnosRes.data as Turno[]) || []);
      setBarberos((barberosRes.data as Barbero[]) || []);
      setTotalMes((pagosMesRes.data || []).reduce((acc: number, p: { monto: number }) => acc + Number(p.monto || 0), 0));
      const filtro = esBarbero && miBarberoId ? miBarberoId : filtroBarbero;
      const dias = Array.from(
        new Set(
          (mesRes.data || [])
            .filter((t: { barbero_id: string | null }) => filtro === "todos" || t.barbero_id === filtro)
            .map((t: { fecha_hora: string }) => ymd(new Date(t.fecha_hora)))
        )
      );
      setDiasConTurno(dias);
      setLoading(false);
    };
    void load();
  }, [fecha, mes, filtroBarbero, esBarbero, miBarberoId]);

  const filtroActivo = esBarbero && miBarberoId ? miBarberoId : filtroBarbero;
  const turnosFiltrados = useMemo(
    () => (filtroActivo === "todos" ? turnos : turnos.filter((t) => t.barbero_id === filtroActivo)),
    [turnos, filtroActivo]
  );
  const totalDia = useMemo(() => turnosFiltrados.reduce((acc, t) => acc + Number(one(t.pagos)?.monto || 0), 0), [turnosFiltrados]);

  const celdasMes = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    const start = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(`${mes}-${String(d).padStart(2, "0")}`);
    return cells;
  }, [mes]);

  const mesLabel = new Date(`${mes}-01T12:00:00-03:00`).toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  const cambiarEstado = async (id: string, estado: string) => {
    const supabase = createClient();
    const { error: e } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (e) return setError(e.message);
    setTurnos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
  };

  const registrarPago = async (turno: Turno, metodo: "efectivo" | "transferencia") => {
    const supabase = createClient();
    const monto = Number(one(turno.servicios)?.precio || 0);
    const { data, error: e } = await supabase
      .from("pagos")
      .insert({ barberia_id: turno.barberia_id, turno_id: turno.id, monto, metodo })
      .select("id, monto, metodo")
      .single();
    if (e) return setError(e.message);
    await supabase.from("turnos").update({ estado: "realizado" }).eq("id", turno.id);
    setTurnos((prev) => prev.map((t) => (t.id === turno.id ? { ...t, pagos: data, estado: "realizado" } : t)));
    setTotalMes((n) => n + monto);
  };

  const moverTurno = async (turno: Turno) => {
    if (!nuevaFecha || !nuevaHora) return;
    const supabase = createClient();
    const fechaHora = new Date(`${nuevaFecha}T${nuevaHora}:00-03:00`).toISOString();
    const { error: e } = await supabase
      .from("turnos")
      .update({ fecha_hora: fechaHora, estado: "confirmado", barbero_id: nuevoBarbero || turno.barbero_id })
      .eq("id", turno.id);
    if (e) return setError(e.message);
    await avisoCambio(turno.id, "movido");
    setEditId(null);
    setFecha(nuevaFecha);
    setMes(nuevaFecha.slice(0, 7));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen pb-28" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader
          left={
            <button onClick={() => void handleLogout()} className="text-sm" style={{ color: "var(--muted)" }}>
              Salir
            </button>
          }
        />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Hola, {nombre}
        </p>
        <h1 className="text-[34px] font-semibold tracking-tight leading-9 mb-4">Agenda</h1>

        {!esBarbero && barberos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button onClick={() => setFiltroBarbero("todos")} className="shrink-0 rounded-full px-4 py-2 text-sm" style={{ background: filtroBarbero === "todos" ? "#1c1712" : "var(--card)", color: filtroBarbero === "todos" ? "#fff" : "var(--text)", border: "1px solid var(--line)" }}>
              Todos
            </button>
            {barberos.map((b) => (
              <button key={b.id} onClick={() => setFiltroBarbero(b.id)} className="shrink-0 rounded-full px-4 py-2 text-sm" style={{ background: filtroBarbero === b.id ? "#1c1712" : "var(--card)", color: filtroBarbero === b.id ? "#fff" : "var(--text)", border: "1px solid var(--line)" }}>
                {b.nombre}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 mb-5" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMes((m) => { const d = new Date(`${m}-01T12:00:00-03:00`); d.setMonth(d.getMonth() - 1); return ymd(d).slice(0, 7); })}>‹</button>
            <p className="text-sm font-medium capitalize">{mesLabel}</p>
            <button onClick={() => setMes((m) => { const d = new Date(`${m}-01T12:00:00-03:00`); d.setMonth(d.getMonth() + 1); return ymd(d).slice(0, 7); })}>›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] mb-2" style={{ color: "var(--muted)" }}>
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
            {celdasMes.map((value, i) => {
              if (!value) return <span key={i} />;
              const sel = fecha === value;
              const conTurno = diasConTurno.includes(value);
              const esHoy = value === hoy;
              return (
                <button
                  key={value}
                  onClick={() => setFecha(value)}
                  className="h-8 w-8 mx-auto rounded-full"
                  style={{
                    background: sel ? "#1c1712" : conTurno ? "var(--bg)" : "transparent",
                    color: sel ? "#f4efe6" : esHoy ? "#8B3A3A" : "var(--text)",
                    border: conTurno && !sel ? "1px solid var(--line)" : "none",
                    fontWeight: esHoy || sel ? 600 : 400,
                  }}
                >
                  {Number(value.slice(8))}
                </button>
              );
            })}
          </div>
        </div>

        {!esBarbero && (
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            Día ${totalDia} · Mes ${totalMes}
          </p>
        )}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {loading && <p style={{ color: "var(--muted)" }}>Cargando...</p>}
        {!loading && turnosFiltrados.length === 0 && <p style={{ color: "var(--muted)" }}>No hay turnos este día.</p>}

        {turnosFiltrados.map((t) => {
          const cliente = one(t.clientes);
          const servicio = one(t.servicios);
          const pago = one(t.pagos);
          const profesional = one(t.barberos);
          const extra = abierto === t.id;
          return (
            <article key={t.id} className="mb-3 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8 }}>
              <div className="flex">
                <div className="w-2 shrink-0" style={{ background: "#1c1712" }} />
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold">
                      {horaUy(t.fecha_hora)} - {fechaCorta(t.fecha_hora)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Nº {nroTurno(t.id)}
                    </p>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Servicio:</span> {servicio?.nombre}
                    {servicio?.precio ? ` $${servicio.precio}` : ""}
                  </p>
                  {profesional?.nombre && (
                    <p className="text-sm">
                      <span className="font-medium">Profesional:</span> {profesional.nombre}
                    </p>
                  )}
                  <p className="text-sm capitalize">
                    <span className="font-medium">Estado:</span> {t.estado.replace("_", " ")}
                  </p>
                  <div className="flex justify-between items-end">
                    <p className="text-sm">
                      <span className="font-medium">Nombre:</span> {cliente?.nombre || "Cliente"}
                    </p>
                    <button type="button" className="text-xs" style={{ color: "var(--muted)" }} onClick={() => setAbierto(extra ? null : t.id)}>
                      {extra ? "(− info)" : "(+ info)"}
                    </button>
                  </div>

                  {extra && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
                      {cliente?.telefono && <p className="text-sm mb-2">{cliente.telefono}</p>}
                      <div className="flex flex-wrap gap-2">
                        {t.estado === "pendiente" && (
                          <button
                            onClick={() => {
                              void (async () => {
                                await cambiarEstado(t.id, "confirmado");
                                const res = await fetch("/api/whatsapp/reserva", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ turnoId: t.id, soloCliente: true }),
                                });
                                const data = await res.json();
                                if (data.skipped === "manual" && cliente?.telefono) {
                                  abrirWhatsapp(
                                    cliente.telefono,
                                    `Hola ${cliente.nombre}, te confirmamos el turno.\n\nServicio: ${servicio?.nombre}\nDía: ${fechaUy(t.fecha_hora)}\nHora: ${horaUy(t.fecha_hora)}`
                                  );
                                }
                              })();
                            }}
                            className="text-xs px-3 py-2 rounded-full"
                            style={{ background: "#1c1712", color: "#f4efe6" }}
                          >
                            Confirmar y avisar
                          </button>
                        )}
                        {cliente?.telefono && (
                          <button
                            onClick={() =>
                              abrirWhatsapp(
                                cliente.telefono,
                                `Hola ${cliente.nombre}, te recordamos tu turno.\n\n${servicio?.nombre}\n${fechaUy(t.fecha_hora)} · ${horaUy(t.fecha_hora)}`
                              )
                            }
                            className="text-xs px-3 py-2 rounded-full"
                            style={{ border: "1px solid var(--line)" }}
                          >
                            Recordatorio
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditId(t.id);
                            setNuevaFecha(ymd(new Date(t.fecha_hora)));
                            setNuevaHora(horaUy(t.fecha_hora));
                            setNuevoBarbero(t.barbero_id || "");
                          }}
                          className="text-xs px-3 py-2 rounded-full"
                          style={{ border: "1px solid var(--line)" }}
                        >
                          Mover
                        </button>
                        <button onClick={() => void cambiarEstado(t.id, "no_asistio")} className="text-xs px-3 py-2 rounded-full" style={{ border: "1px solid var(--line)" }}>
                          No vino
                        </button>
                        <button
                          onClick={() => {
                            void cambiarEstado(t.id, "cancelado");
                            void avisoCambio(t.id, "cancelado");
                          }}
                          className="text-xs px-3 py-2 rounded-full text-red-500"
                        >
                          Cancelar
                        </button>
                      </div>
                      {editId === t.id && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
                          <input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
                          {!esBarbero && barberos.length > 0 && (
                            <select value={nuevoBarbero} onChange={(e) => setNuevoBarbero(e.target.value)} className="col-span-2 rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }}>
                              <option value="">Profesional</option>
                              {barberos.map((b) => (
                                <option key={b.id} value={b.id}>{b.nombre}</option>
                              ))}
                            </select>
                          )}
                          <button onClick={() => void moverTurno(t)} className="col-span-2 rounded-xl py-2 text-sm" style={{ background: "#1c1712", color: "#f4efe6" }}>
                            Guardar y avisar
                          </button>
                        </div>
                      )}
                      {pago ? (
                        <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
                          Pagado · {pago.metodo} · ${pago.monto}
                        </p>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => void registrarPago(t, "efectivo")} className="text-xs px-3 py-2 rounded-full" style={{ border: "1px solid var(--line)" }}>
                            Efectivo
                          </button>
                          <button onClick={() => void registrarPago(t, "transferencia")} className="text-xs px-3 py-2 rounded-full" style={{ border: "1px solid var(--line)" }}>
                            Transferencia
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
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
