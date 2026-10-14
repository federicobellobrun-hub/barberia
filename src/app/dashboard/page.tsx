"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";

type Persona = { nombre: string; telefono: string };
type Servicio = { nombre: string; precio: number };
type Barbero = { id: string; nombre: string };
type Mascota = {
  nombre: string;
  tamano: string | null;
  edad: string | null;
  raza: string | null;
  pelo: string | null;
  estado_pelo: string | null;
  temperamento: string | null;
  sociable: boolean | null;
};
type Turno = {
  id: string;
  barbero_id: string | null;
  fecha_hora: string;
  duracion_minutos?: number | null;
  estado: string;
  precio_total?: number | null;
  cliente_nombre?: string | null;
  clientes: Persona | Persona[] | null;
  servicios: Servicio | Servicio[] | null;
  barberos: Barbero | Barbero[] | null;
  mascotas: Mascota | Mascota[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
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
    hour12: false,
    timeZone: "America/Montevideo",
  });
}

function horaInput(fechaHora: string) {
  return new Date(fechaHora)
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Montevideo",
    })
    .replace(".", ":")
    .slice(0, 5);
}

function fechaCorta(fechaHora: string) {
  return new Date(fechaHora).toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Montevideo",
  });
}

function slots() {
  const out: string[] = [];
  for (let h = 8; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}

function waLink(telefono: string, texto: string) {
  const solo = telefono.replace(/\D/g, "");
  const num = solo.startsWith("598") ? solo : solo.startsWith("0") ? `598${solo.slice(1)}` : `598${solo}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

function vivo(estado: string) {
  return estado !== "cancelado" && estado !== "no_vino";
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
  const [verCancelados, setVerCancelados] = useState(false);
  const [shopId, setShopId] = useState("");
  const [esBarbero, setEsBarbero] = useState(false);
  const [linkPublico, setLinkPublico] = useState("");
  const [modoWa, setModoWa] = useState("manual");
  const [diasPlan, setDiasPlan] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [moverFecha, setMoverFecha] = useState("");
  const [moverHora, setMoverHora] = useState("");
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
      setShopId(me.barberia_id);
      const { data: shop } = await supabase
        .from("barberias")
        .select("slug, modo_whatsapp, plan, plan_hasta, trial_hasta")
        .eq("id", me.barberia_id)
        .maybeSingle();
      if (shop?.slug) setLinkPublico(`https://${shop.slug}.reservoapps.com`);
      setModoWa(shop?.modo_whatsapp || "manual");
      const fechas = [shop?.plan_hasta, shop?.trial_hasta].filter(Boolean).map((f) => new Date(f as string).getTime());
      const vence = fechas.length ? Math.max(...fechas) : null;
      setDiasPlan(vence ? Math.ceil((vence - Date.now()) / 86400000) : null);
      const { data: bars } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", me.barberia_id).order("nombre");
      setBarberos((bars as Barbero[]) || []);
      const desde = new Date(y, m, 1);
      const hasta = new Date(y, m + 1, 0, 23, 59, 59);
      let q = supabase
        .from("turnos")
        .select("id, barbero_id, fecha_hora, duracion_minutos, estado, precio_total, cliente_nombre, clientes(nombre, telefono), servicios(nombre, precio), barberos(id, nombre), mascotas(nombre, tamano, edad, raza, pelo, estado_pelo, temperamento, sociable)")
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
      if (vivo(t.estado)) set.add(ymd(new Date(t.fecha_hora)));
    });
    return set;
  }, [turnosMes]);

  const turnosDia = useMemo(() => {
    return turnosMes.filter((t) => {
      if (ymd(new Date(t.fecha_hora)) !== fecha) return false;
      if (!verCancelados && !vivo(t.estado)) return false;
      if (filtroBarbero !== "todos" && t.barbero_id !== filtroBarbero) return false;
      return true;
    });
  }, [turnosMes, fecha, verCancelados, filtroBarbero]);

  const diasMes = useMemo(() => {
    const first = new Date(y, m, 1);
    const start = first.getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = Array(start).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [y, m]);

  const cambiarEstado = async (id: string, estado: string) => {
    const { error: e } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (e) return setError(e.message);
    setTurnosMes((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
  };

  const moverTurno = async (t: Turno) => {
    if (!moverFecha || !moverHora) return setError("Elegí día y hora");
    const fecha_hora = new Date(`${moverFecha}T${moverHora}:00-03:00`).toISOString();
    const inicio = new Date(`${moverFecha}T00:00:00-03:00`).toISOString();
    const fin = new Date(`${moverFecha}T23:59:59-03:00`).toISOString();
    const { data: bloqueos } = await supabase
      .from("bloqueos")
      .select("fecha_inicio, fecha_fin, todo_el_dia")
      .eq("barberia_id", shopId)
      .lte("fecha_inicio", fin)
      .gte("fecha_fin", inicio);
    const diaBloqueado = (bloqueos || []).some(
      (b) => b.todo_el_dia !== false && String(b.fecha_inicio).slice(0, 10) <= moverFecha && String(b.fecha_fin).slice(0, 10) >= moverFecha
    );
    if (diaBloqueado) return setError("Ese día está bloqueado");
    let q = supabase
      .from("turnos")
      .select("id, fecha_hora, duracion_minutos, barbero_id")
      .eq("barberia_id", shopId)
      .gte("fecha_hora", inicio)
      .lte("fecha_hora", fin)
      .neq("id", t.id)
      .neq("estado", "cancelado");
    if (t.barbero_id) q = q.eq("barbero_id", t.barbero_id);
    const { data: delDestino, error: qe } = await q;
    if (qe) return setError(qe.message);
    const ini = new Date(fecha_hora).getTime();
    const finT = ini + (t.duracion_minutos || 30) * 60000;
    const choca = (delDestino || []).some((o) => {
      const a = new Date(o.fecha_hora).getTime();
      const b = a + (o.duracion_minutos || 30) * 60000;
      return ini < b && a < finT;
    });
    if (choca) return setError("Ese horario se superpone con otro turno");
    const { error: e } = await supabase.from("turnos").update({ fecha_hora }).eq("id", t.id);
    if (e) return setError(e.message);
    setAbierto(null);
    setTurnosMes((prev) => prev.map((x) => (x.id === t.id ? { ...x, fecha_hora } : x)));
    const c = one(t.clientes);
    const quien = t.cliente_nombre || c?.nombre || "cliente";
    const texto = `Hola ${quien}, te reagendamos el turno al ${fechaCorta(fecha_hora)} a las ${horaUy(fecha_hora)}.`;
    if (modoWa !== "automatico" && c?.telefono) window.open(waLink(c.telefono, texto), "_blank");
    await fetch("/api/whatsapp/cambio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnoId: t.id, tipo: "movido" }),
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-4">
      <BrandHeader left={<span className="font-medium">Agenda</span>} />
      {!esBarbero && diasPlan !== null && diasPlan <= 7 && (
        <div className="mb-3 rounded-2xl p-3 text-sm" style={{ background: diasPlan < 0 ? "#3b1d1d" : "#3a2e14", color: "#F6F1E8" }}>
          {diasPlan < 0
            ? "El plan está vencido. Renovalo en Configuración para seguir usando la agenda."
            : diasPlan === 0
              ? "El plan vence hoy. Renovalo en Configuración."
              : `Te quedan ${diasPlan} día${diasPlan === 1 ? "" : "s"} de plan.`}
          <a href="/dashboard/config" className="mt-2 block underline">Ir a pagar</a>
        </div>
      )}
      {!esBarbero && linkPublico && (
        <div className="mb-3 rounded-2xl p-3 text-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Link para clientes</p>
          <p className="break-all">{linkPublico}</p>
          <button
            className="mt-2 text-xs underline"
            onClick={() => {
              void navigator.clipboard.writeText(linkPublico);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1500);
            }}
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setM(m === 0 ? (setY(y - 1), 11) : m - 1)} className="h-9 w-9 rounded-full" style={{ border: "1px solid var(--line)" }}>‹</button>
        <p className="capitalize">{mesLabel(y, m)}</p>
        <button onClick={() => setM(m === 11 ? (setY(y + 1), 0) : m + 1)} className="h-9 w-9 rounded-full" style={{ border: "1px solid var(--line)" }}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2" style={{ color: "var(--muted)" }}>
        {DOW.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {diasMes.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
          const sel = iso === fecha;
          const con = diasConTurno.has(iso);
          return (
            <button
              key={iso}
              onClick={() => setFecha(iso)}
              className="h-9 rounded-full text-sm"
              style={{ background: sel ? "var(--text)" : "transparent", color: sel ? "var(--bg)" : "var(--text)" }}
            >
              {d}
              {con && !sel && <span className="block mx-auto mt-[-2px] h-1 w-1 rounded-full" style={{ background: "var(--muted)" }} />}
            </button>
          );
        })}
      </div>
      {barberos.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          <button onClick={() => setFiltroBarbero("todos")} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid var(--line)", background: filtroBarbero === "todos" ? "var(--text)" : "transparent", color: filtroBarbero === "todos" ? "var(--bg)" : "var(--text)" }}>Todos</button>
          {barberos.map((b) => (
            <button key={b.id} onClick={() => setFiltroBarbero(b.id)} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid var(--line)", background: filtroBarbero === b.id ? "var(--text)" : "transparent", color: filtroBarbero === b.id ? "var(--bg)" : "var(--text)" }}>{b.nombre}</button>
          ))}
        </div>
      )}
      <button onClick={() => setVerCancelados((v) => !v)} className="mb-3 text-xs underline" style={{ color: "var(--muted)" }}>
        {verCancelados ? "Ocultar cancelados" : "Ver cancelados"}
      </button>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {loading && <p style={{ color: "var(--muted)" }}>Cargando...</p>}
      {!loading && turnosDia.length === 0 && <p style={{ color: "var(--muted)" }}>No hay turnos este día.</p>}
      {turnosDia.map((t) => {
        const c = one(t.clientes);
        const s = one(t.servicios);
        const b = one(t.barberos);
        const pet = one(t.mascotas);
        const quien = t.cliente_nombre || c?.nombre || "Cliente";
        const open = abierto === t.id;
        return (
          <div key={t.id} className="mb-3 rounded-2xl p-3" style={{ background: "var(--card)", border: "1px solid var(--line)", opacity: vivo(t.estado) ? 1 : 0.55 }}>
            <button className="w-full text-left" onClick={() => { setAbierto(open ? null : t.id); setMoverFecha(ymd(new Date(t.fecha_hora))); setMoverHora(horaInput(t.fecha_hora)); }}>
              <p className="font-medium">{horaUy(t.fecha_hora)} · {quien}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{s?.nombre || "Servicio"}{b ? ` · ${b.nombre}` : ""} · {t.estado}</p>
              {pet && <p className="text-xs" style={{ color: "var(--muted)" }}>{pet.nombre} · {pet.tamano || ""} {pet.raza || ""}</p>}
            </button>
            {open && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => void cambiarEstado(t.id, "confirmado")} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid var(--line)" }}>Confirmar</button>
                  <button onClick={() => void cambiarEstado(t.id, "realizado")} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid var(--line)" }}>Hecho</button>
                  <button onClick={() => void cambiarEstado(t.id, "cancelado")} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid var(--line)" }}>Cancelar</button>
                  <button onClick={() => void cambiarEstado(t.id, "no_vino")} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid var(--line)" }}>No vino</button>
                </div>
                <div className="flex gap-2">
                  <input type="date" value={moverFecha} onChange={(e) => setMoverFecha(e.target.value)} className="rounded-xl px-2 py-1 text-sm" style={{ background: "var(--bg)", border: "1px solid var(--line)" }} />
                  <select value={moverHora} onChange={(e) => setMoverHora(e.target.value)} className="rounded-xl px-2 py-1 text-sm" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
                    {slots().map((h) => <option key={h}>{h}</option>)}
                  </select>
                  <button onClick={() => void moverTurno(t)} className="rounded-xl px-3 text-sm" style={{ background: "var(--text)", color: "var(--bg)" }}>Mover</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
