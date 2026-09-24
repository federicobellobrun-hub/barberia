"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";

type Persona = { nombre: string; telefono: string };
type Servicio = { nombre: string; precio: number };
type Barbero = { id: string; nombre: string };
type Mascota = { nombre: string; tamano: string };
type Turno = {
  id: string;
  barbero_id: string | null;
  fecha_hora: string;
  estado: string;
  precio_total?: number | null;
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
  const [esBarbero, setEsBarbero] = useState(false);
  const [linkPublico, setLinkPublico] = useState("");
  const [modoWa, setModoWa] = useState("manual");
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
      const { data: shop } = await supabase
        .from("barberias")
        .select("slug, modo_whatsapp")
        .eq("id", me.barberia_id)
        .maybeSingle();
      if (shop?.slug) setLinkPublico(`https://${shop.slug}.reservoapps.com`);
      setModoWa(shop?.modo_whatsapp || "manual");
      const { data: bars } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", me.barberia_id).order("nombre");
      setBarberos((bars as Barbero[]) || []);
      const desde = new Date(y, m, 1);
      const hasta = new Date(y, m + 1, 0, 23, 59, 59);
      let q = supabase
        .from("turnos")
        .select("id, barbero_id, fecha_hora, estado, precio_total, clientes(nombre, telefono), servicios(nombre, precio), barberos(id, nombre), mascotas(nombre, tamano)")
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
      if (!vivo(t.estado)) return;
      if (filtroBarbero !== "todos" && t.barbero_id !== filtroBarbero) return;
      set.add(ymd(new Date(t.fecha_hora)));
    });
    return set;
  }, [turnosMes, filtroBarbero]);

  const delDia = useMemo(
    () =>
      turnosMes.filter((t) => {
        const okDia = ymd(new Date(t.fecha_hora)) === fecha;
        const okBar = filtroBarbero === "todos" || t.barbero_id === filtroBarbero;
        const okEstado = verCancelados || vivo(t.estado);
        return okDia && okBar && okEstado;
      }),
    [turnosMes, fecha, filtroBarbero, verCancelados]
  );

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

  const eliminarTurno = async (id: string) => {
    if (!confirm("¿Eliminar este turno de la agenda?")) return;
    const { error: e } = await supabase.from("turnos").delete().eq("id", id);
    if (e) setError(e.message);
    else setTurnosMes((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmarSenia = async (t: Turno) => {
    await cambiarEstado(t.id, "confirmado");
    const c = one(t.clientes);
    const s = one(t.servicios);
    const texto = `Hola ${c?.nombre || ""}, te confirmamos el turno${s?.nombre ? ` de ${s.nombre}` : ""} el ${fechaCorta(t.fecha_hora)} a las ${horaUy(t.fecha_hora)}. Cualquier cambio escribinos.`;
    if (modoWa !== "automatico" && c?.telefono) window.open(waLink(c.telefono, texto), "_blank");
    await fetch("/api/whatsapp/reserva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnoId: t.id, soloCliente: true }),
    });
  };

  const moverTurno = async (t: Turno) => {
    if (!moverFecha || !moverHora) return setError("Elegí día y hora");
    const fecha_hora = new Date(`${moverFecha}T${moverHora}:00-03:00`).toISOString();
    const { error: e } = await supabase.from("turnos").update({ fecha_hora }).eq("id", t.id);
    if (e) return setError(e.message);
    setTurnosMes((prev) => prev.map((x) => (x.id === t.id ? { ...x, fecha_hora } : x)));
    setFecha(moverFecha);
    const c = one(t.clientes);
    const texto = `Hola ${c?.nombre || ""}, te reagendamos el turno al ${fechaCorta(fecha_hora)} a las ${horaUy(fecha_hora)}.`;
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
      {!esBarbero && linkPublico && (
        <div className="mb-3 rounded-2xl p-3 text-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Link para clientes</p>
          <p className="break-all">{linkPublico}</p>
          <button
            className="mt-2 text-xs underline"
            onClick={async () => {
              await navigator.clipboard.writeText(linkPublico);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1500);
            }}
          >
            {copiado ? "Copiado" : "Copiar link"}
          </button>
        </div>
      )}
      {!esBarbero && barberos.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFiltroBarbero("todos")} className="shrink-0 rounded-full px-3 py-1.5 text-sm" style={{ background: filtroBarbero === "todos" ? "#1A1612" : "var(--card)", color: filtroBarbero === "todos" ? "#F6F1E8" : "inherit" }}>
            Todos
          </button>
          {barberos.map((b) => (
            <button key={b.id} onClick={() => setFiltroBarbero(b.id)} className="shrink-0 rounded-full px-3 py-1.5 text-sm" style={{ background: filtroBarbero === b.id ? "#1A1612" : "var(--card)", color: filtroBarbero === b.id ? "#F6F1E8" : "inherit" }}>
              {b.nombre}
            </button>
          ))}
        </div>
      )}
      <section className="mb-4 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="capitalize">{mesLabel(y, m)}</p>
          <div className="flex gap-2">
            <button onClick={() => { const d = new Date(y, m - 1, 1); setY(d.getFullYear()); setM(d.getMonth()); }} className="h-8 w-8 rounded-full" style={{ border: "1px solid var(--line)" }}>‹</button>
            <button onClick={() => { const d = new Date(y, m + 1, 1); setY(d.getFullYear()); setM(d.getMonth()); }} className="h-8 w-8 rounded-full" style={{ border: "1px solid var(--line)" }}>›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]" style={{ color: "var(--muted)" }}>
          {DOW.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {celdas.map((c) => {
            if (!c.d) return <span key={c.key} />;
            const iso = `${y}-${pad(m + 1)}-${pad(c.d)}`;
            const sel = iso === fecha;
            const con = diasConTurno.has(iso);
            return (
              <button key={c.key} onClick={() => setFecha(iso)} className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ background: sel ? "#2563eb" : con ? "#dbeafe" : "transparent", color: sel ? "#fff" : iso === hoy ? "#dc2626" : "inherit" }}>
                {c.d}
              </button>
            );
          })}
        </div>
      </section>
      <button type="button" onClick={() => setVerCancelados((v) => !v)} className="mb-3 text-xs underline">
        {verCancelados ? "Ocultar cancelados" : "Ver cancelados"}
      </button>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm">Cargando agenda...</p>}
      {!loading && delDia.length === 0 && <p className="text-sm">No hay turnos el {fechaCorta(`${fecha}T12:00:00-03:00`)}.</p>}
      {delDia.map((t) => {
        const c = one(t.clientes);
        const s = one(t.servicios);
        const b = one(t.barberos);
        const pet = one(t.mascotas);
        const open = abierto === t.id;
        return (
          <article key={t.id} className="mb-3 overflow-hidden rounded-xl" style={{ border: "1px solid #d7d1c6", background: "#fff" }}>
            <div className="flex">
              <div className="w-2 shrink-0" style={{ background: t.estado === "pendiente" ? "#b45309" : t.estado === "cancelado" ? "#999" : "#111" }} />
              <div className="flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{horaUy(t.fecha_hora)} - {fechaCorta(t.fecha_hora)}</p>
                  <span className="text-[11px]">{t.estado}</span>
                </div>
                <p className="text-sm"><b>Servicio:</b> {s?.nombre || "—"}</p>
                {pet && <p className="text-sm"><b>Mascota:</b> {pet.nombre} · {pet.tamano}</p>}
                <p className="text-sm"><b>Profesional:</b> {b?.nombre || "—"}</p>
                <p className="text-sm"><b>Nombre:</b> {c?.nombre || "Cliente"}</p>
                {t.precio_total != null && <p className="text-sm"><b>Total:</b> ${t.precio_total}</p>}
                <button
                  onClick={() => {
                    if (open) setAbierto(null);
                    else {
                      setAbierto(t.id);
                      setMoverFecha(ymd(new Date(t.fecha_hora)));
                      setMoverHora(horaInput(t.fecha_hora));
                    }
                  }}
                  className="mt-1 text-sm"
                >
                  {open ? "(− info)" : "(+ info)"}
                </button>
                {open && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                    {c?.telefono && <p className="w-full text-xs">{c.telefono}</p>}
                    {t.estado === "pendiente" && (
                      <button onClick={() => void confirmarSenia(t)} className="rounded-full px-3 py-1.5 text-xs" style={{ background: "#111", color: "#fff" }}>
                        {modoWa === "automatico" ? "Confirmar" : "Confirmar y WhatsApp"}
                      </button>
                    )}
                    <button onClick={() => void cambiarEstado(t.id, "realizado")} className="rounded-full px-3 py-1.5 text-xs" style={{ border: "1px solid #ddd" }}>Realizado</button>
                    <button onClick={() => void cambiarEstado(t.id, "no_vino")} className="rounded-full px-3 py-1.5 text-xs" style={{ border: "1px solid #ddd" }}>No vino</button>
                    {t.estado !== "cancelado" && (
                      <button onClick={() => void cambiarEstado(t.id, "cancelado")} className="rounded-full px-3 py-1.5 text-xs" style={{ border: "1px solid #ddd" }}>Cancelar</button>
                    )}
                    <button onClick={() => void eliminarTurno(t.id)} className="rounded-full px-3 py-1.5 text-xs text-red-600" style={{ border: "1px solid #f1c0c0" }}>
                      Eliminar
                    </button>
                    <div className="mt-3 w-full space-y-2 rounded-xl p-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
                      <p className="text-xs font-medium">Reagendar</p>
                      <label className="block text-[11px]" style={{ color: "var(--muted)" }}>Nuevo día</label>
                      <input type="date" value={moverFecha} onChange={(e) => setMoverFecha(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)" }} />
                      <label className="block text-[11px]" style={{ color: "var(--muted)" }}>Nueva hora</label>
                      <select value={moverHora} onChange={(e) => setMoverHora(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)" }}>
                        <option value="">Elegí hora</option>
                        {slots().map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void moverTurno(t)}
                        disabled={!moverFecha || !moverHora}
                        className="w-full rounded-full py-2 text-sm"
                        style={{ background: "#111", color: "#fff", opacity: !moverFecha || !moverHora ? 0.4 : 1 }}
                      >
                        {modoWa === "automatico" ? "Guardar nuevo horario" : "Guardar nuevo horario y WhatsApp"}
                      </button>
                    </div>
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
