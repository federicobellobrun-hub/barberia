"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";
import { temaPack, aplicarTema } from "@/lib/rubro";

type Servicio = {
  id: string;
  barberia_id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  imagen_url: string | null;
  categoria: string | null;
  sena: number | null;
};
type Barbero = { id: string; nombre: string; foto_url: string | null };
type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string; barbero_id?: string | null };
type Bloqueo = { fecha_inicio: string; fecha_fin: string; todo_el_dia: boolean };
type Turno = { fecha_hora: string; duracion_minutos: number; barbero_id: string | null };
type PagoShop = {
  whatsapp_pedidos: string | null;
  datos_cuenta: string | null;
  mercado_pago_url: string | null;
  pedido_sena: boolean | null;
};

function ymdMontevideo(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}
function weekdayMontevideo(date: Date) {
  const wd = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Montevideo" });
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? date.getDay();
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}
function slugDeHost() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.replace(/^www\./, "");
  if (host === "reservoapps.com" || host === "localhost") return null;
  if (!host.endsWith(".reservoapps.com")) return null;
  return host.replace(/\.reservoapps\.com$/, "") || null;
}
function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}
function linkHttps(url: string) {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function ReservarPage() {
  const search = useSearchParams();
  const slug =
    search.get("b") ||
    slugDeHost() ||
    (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null) ||
    "diano";

  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [rubro, setRubro] = useState(() =>
    typeof window === "undefined" ? "barberia" : localStorage.getItem("rubro_" + slug) || "barberia"
  );
  const [estilo, setEstilo] = useState(() =>
    typeof window === "undefined" ? "auto" : localStorage.getItem("estilo_" + slug) || "auto"
  );
  const [pago, setPago] = useState<PagoShop | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [horariosLocal, setHorariosLocal] = useState<Horario[]>([]);
  const [horariosBarbero, setHorariosBarbero] = useState<Horario[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [vista, setVista] = useState<"categorias" | "servicios">("categorias");
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [metodoSena, setMetodoSena] = useState<"cuenta" | "mp" | null>(null);
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [esperaOk, setEsperaOk] = useState(false);
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const t = temaPack(estilo, rubro);
  const rosa = t.pack === "rosa";
  const radio = rosa ? 999 : 16;
  const mpLink = pago?.mercado_pago_url ? linkHttps(pago.mercado_pago_url) : "";

  useEffect(() => {
    aplicarTema(t);
  }, [estilo, rubro]);

  useEffect(() => {
    if (slug && slug !== "reservoapps.com") localStorage.setItem("barberia_slug", slug);
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: shop, error: shopErr } = await supabase
          .from("barberias")
          .select("id, rubro, estilo, whatsapp_pedidos, datos_cuenta, mercado_pago_url, pedido_sena")
          .eq("slug", slug)
          .maybeSingle();
        if (shopErr || !shop) throw new Error("No se encontró el local");
        setBarberiaId(shop.id);
        const r = shop.rubro || "barberia";
        const pack = shop.estilo || "auto";
        setRubro(r);
        setEstilo(pack);
        localStorage.setItem("rubro_" + slug, r);
        localStorage.setItem("estilo_" + slug, pack);
        aplicarTema(temaPack(pack, r));
        setPago({
          whatsapp_pedidos: shop.whatsapp_pedidos,
          datos_cuenta: shop.datos_cuenta,
          mercado_pago_url: shop.mercado_pago_url,
          pedido_sena: shop.pedido_sena,
        });
        const desde = new Date();
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 40);
        const [servRes, barRes, horRes, horBarRes, bloqRes, turRes] = await Promise.all([
          supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos, precio, imagen_url, categoria, sena").eq("barberia_id", shop.id).eq("activo", true).order("orden"),
          supabase.from("barberos").select("id, nombre, foto_url").eq("barberia_id", shop.id).eq("activo", true).order("nombre"),
          supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin").eq("barberia_id", shop.id).eq("activo", true),
          supabase.from("horario_barbero").select("dia_semana, hora_inicio, hora_fin, barbero_id").eq("barberia_id", shop.id).eq("activo", true),
          supabase.from("bloqueos").select("fecha_inicio, fecha_fin, todo_el_dia").eq("barberia_id", shop.id),
          supabase.from("turnos").select("fecha_hora, duracion_minutos, barbero_id").eq("barberia_id", shop.id).in("estado", ["pendiente", "confirmado", "realizado"]).gte("fecha_hora", desde.toISOString()).lte("fecha_hora", hasta.toISOString()),
        ]);
        if (servRes.error) throw new Error(servRes.error.message);
        setServicios((servRes.data as Servicio[]) || []);
        setBarberos(barRes.data || []);
        setHorariosLocal(horRes.data || []);
        setHorariosBarbero(horBarRes.data || []);
        setBloqueos(bloqRes.data || []);
        setTurnos(turRes.data || []);
        if ((barRes.data || []).length === 1) setBarbero(barRes.data![0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      }
    };
    void load();
  }, [slug]);

  const horarios = useMemo(() => {
    if (!barbero) return horariosLocal;
    const propios = horariosBarbero.filter((h) => h.barbero_id === barbero.id);
    return propios.length ? propios : horariosLocal;
  }, [barbero, horariosLocal, horariosBarbero]);

  const hayCategorias = useMemo(() => servicios.some((s) => Boolean(s.categoria?.trim())), [servicios]);
  const categorias = useMemo(() => {
    if (!hayCategorias) return [["Servicios", servicios]] as [string, Servicio[]][];
    const map = new Map<string, Servicio[]>();
    for (const s of servicios) {
      const k = s.categoria?.trim() || "Servicios";
      map.set(k, [...(map.get(k) || []), s]);
    }
    return Array.from(map.entries());
  }, [servicios, hayCategorias]);
  const listaCat = hayCategorias ? categorias.find(([n]) => n === categoria)?.[1] || [] : servicios;
  const pideSena = Boolean(pago?.pedido_sena && servicio && Number(servicio.sena || 0) > 0);

  const celdasMes = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const start = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(ymdMontevideo(new Date(year, month, d)));
    return cells;
  }, [mes]);

  const horariosDelDia = useMemo(() => {
    if (!servicio || !fecha) return [];
    const date = new Date(`${fecha}T12:00:00-03:00`);
    const horario = horarios.find((h) => Number(h.dia_semana) === weekdayMontevideo(date));
    if (!horario) return [];
    const dayStart = new Date(`${fecha}T00:00:00-03:00`);
    const dayEnd = new Date(`${fecha}T23:59:59-03:00`);
    if (bloqueos.some((b) => b.todo_el_dia && new Date(b.fecha_inicio) <= dayEnd && new Date(b.fecha_fin) >= dayStart)) return [];
    const start = toMinutes(horario.hora_inicio);
    const end = toMinutes(horario.hora_fin);
    const dur = servicio.duracion_minutos;
    const slots: string[] = [];
    for (let mins = start; mins + dur <= end; mins += 30) {
      const hhmm = fromMinutes(mins);
      const slotStart = new Date(`${fecha}T${hhmm}:00-03:00`);
      const slotEnd = new Date(slotStart.getTime() + dur * 60000);
      const chocaBloqueo = bloqueos.some((b) => !b.todo_el_dia && new Date(b.fecha_inicio) < slotEnd && new Date(b.fecha_fin) > slotStart);
      const chocaTurno = turnos.some((turno) => {
        if (barbero && turno.barbero_id && turno.barbero_id !== barbero.id) return false;
        const ini = new Date(turno.fecha_hora);
        return ini < slotEnd && new Date(ini.getTime() + turno.duracion_minutos * 60000) > slotStart;
      });
      if (chocaBloqueo || chocaTurno) continue;
      if (slotStart.getTime() < Date.now() + 30 * 60000) continue;
      slots.push(hhmm);
    }
    return slots;
  }, [servicio, barbero, fecha, horarios, bloqueos, turnos]);

  const textoSena = () => {
    if (!servicio) return "";
    let msg = `Hola, soy ${nombre || "cliente"}. Pedí ${servicio.nombre} el ${fecha} a las ${hora}.`;
    if (pideSena) msg += ` Envío seña $${servicio.sena}.`;
    if (metodoSena === "cuenta" && pago?.datos_cuenta) msg += `\n\nVoy a transferir:\n${pago.datos_cuenta}`;
    if (metodoSena === "mp" && mpLink) msg += `\n\nPago por Mercado Pago:\n${mpLink}`;
    return msg;
  };

  const abrirWhatsapp = () => {
    const tel = pago?.whatsapp_pedidos;
    if (!tel) return;
    window.open(`https://wa.me/${waNumber(tel)}?text=${encodeURIComponent(textoSena())}`, "_blank");
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!servicio || !fecha || !hora) return;
    if (barberos.length > 0 && !barbero) return setError(rosa ? "Elegí una profesional" : "Elegí un barbero");
    if (pideSena && !metodoSena) return setError("Elegí cómo pagar la seña");
    setEnviando(true);
    setError(null);
    try {
      const supabase = createClient();
      const fechaHora = new Date(`${fecha}T${hora}:00-03:00`).toISOString();
      const { error: rpcError } = await supabase.rpc("crear_reserva", {
        p_barberia_id: servicio.barberia_id,
        p_servicio_id: servicio.id,
        p_nombre: nombre.trim(),
        p_telefono: telefono.trim(),
        p_fecha_hora: fechaHora,
        p_duracion_minutos: servicio.duracion_minutos,
        p_barbero_id: barbero?.id || null,
      });
      if (rpcError) throw new Error(rpcError.message);
      const { data: creado } = await supabase.from("turnos").select("id").eq("barberia_id", servicio.barberia_id).eq("fecha_hora", fechaHora).order("id", { ascending: false }).limit(1).maybeSingle();
      if (creado?.id && !pideSena) {
        await fetch("/api/whatsapp/reserva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turnoId: creado.id }),
        });
      }
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar");
    } finally {
      setEnviando(false);
    }
  };

  const anotarEspera = async (e: FormEvent) => {
    e.preventDefault();
    if (!servicio || !barberiaId) return;
    const supabase = createClient();
    const { error: waitError } = await supabase.from("lista_espera").insert({
      barberia_id: barberiaId,
      servicio_id: servicio.id,
      nombre,
      telefono,
      fecha,
    });
    if (waitError) setError(waitError.message);
    else setEsperaOk(true);
  };

  const hoy = ymdMontevideo(new Date());
  const mesLabel = mes.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
  const nav = (
    <BottomNav
      items={[
        { href: `/b/${slug}`, label: "Inicio" },
        { href: `/reservar?b=${slug}`, label: "Reservar", active: true },
        { href: `/tienda?b=${slug}`, label: "Tienda" },
      ]}
      bg={t.bg}
      line={t.line}
      text={t.text}
      muted={t.muted}
    />
  );

  const TarjetaServicio = ({ s }: { s: Servicio }) => {
    const activo = servicio?.id === s.id;
    return (
      <button type="button" onClick={() => { setServicio(s); setMetodoSena(null); setHora(""); }} className="w-full flex gap-3 text-left overflow-hidden" style={{ background: t.card, border: activo ? `1.5px solid ${t.btn}` : `1px solid ${t.line}`, borderRadius: rosa ? 18 : 16 }}>
        {s.imagen_url ? <img src={s.imagen_url} alt="" className="h-20 w-20 object-cover shrink-0" /> : <div className="h-20 w-20 shrink-0 flex items-center justify-center text-xl" style={{ background: t.bg, color: t.btn }}>{t.icono}</div>}
        <div className="py-3 pr-3 min-w-0">
          <p className="font-medium">{s.nombre}</p>
          <p className="text-sm" style={{ color: t.muted }}>${s.precio} · {s.duracion_minutos} min</p>
        </div>
      </button>
    );
  };

  return (
    <main className="min-h-screen pb-28" style={{ background: t.bg, color: t.text }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        <h1 className="text-[34px] tracking-tight leading-9" style={{ fontFamily: "Georgia, Times, serif" }}>{t.cita}</h1>
        <p className="mt-2 mb-5" style={{ color: t.muted }}>{hayCategorias ? "Elegí categoría y servicio" : "Elegí servicio"}</p>
        {error && <p className="mb-6 text-red-500 text-sm">{error}</p>}

        {!hayCategorias ? (
          <div className="space-y-2 mb-4">{servicios.map((s) => <TarjetaServicio key={s.id} s={s} />)}</div>
        ) : (
          <div className="relative overflow-hidden mb-4">
            <div className="flex" style={{ width: "200%", transform: vista === "servicios" ? "translateX(-50%)" : "translateX(0)", transition: "transform 320ms ease" }}>
              <div className="w-1/2 pr-1">
                <div className="grid grid-cols-2 gap-2">
                  {categorias.map(([nombreCat, items]) => (
                    <button key={nombreCat} type="button" onClick={() => { setCategoria(nombreCat); setServicio(null); setMetodoSena(null); setHora(""); setVista("servicios"); }} className="p-4 text-left" style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: rosa ? 18 : 16 }}>
                      <p className="font-medium">{nombreCat}</p>
                      <p className="text-xs mt-1" style={{ color: t.muted }}>{items.length} servicios</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/2 pl-1">
                <button type="button" onClick={() => { setVista("categorias"); setServicio(null); setMetodoSena(null); }} className="text-sm mb-3" style={{ color: t.muted }}>‹ Categorías</button>
                <h2 className="font-medium mb-3">{categoria}</h2>
                <div className="space-y-2">{listaCat.map((s) => <TarjetaServicio key={s.id} s={s} />)}</div>
              </div>
            </div>
          </div>
        )}

        {servicio && (
          <div className="mb-5 p-4" style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.line}` }}>
            {servicio.imagen_url && <img src={servicio.imagen_url} alt="" className="h-36 w-full object-cover rounded-xl mb-3" />}
            <p className="text-lg font-medium">{servicio.nombre}</p>
            <p className="text-sm mt-1" style={{ color: t.muted }}>{servicio.duracion_minutos} min · ${servicio.precio}</p>
            {pideSena ? (
              <>
                <p className="mt-3 font-medium">Requiere seña ${servicio.sena}</p>
                {pago?.datos_cuenta && <button type="button" onClick={() => setMetodoSena("cuenta")} className="w-full text-left p-3 mb-2 mt-2" style={{ border: metodoSena === "cuenta" ? `1.5px solid ${t.btn}` : `1px solid ${t.line}`, borderRadius: 12 }}>Transferencia / cuenta</button>}
                {mpLink && <button type="button" onClick={() => setMetodoSena("mp")} className="w-full text-left p-3" style={{ border: metodoSena === "mp" ? `1.5px solid ${t.btn}` : `1px solid ${t.line}`, borderRadius: 12 }}>Mercado Pago</button>}
              </>
            ) : (
              <p className="text-sm mt-2" style={{ color: t.muted }}>Sin seña</p>
            )}
          </div>
        )}

        {servicio && (!pideSena || metodoSena) && barberos.length > 0 && (
          <>
            <h2 className="font-medium mb-3">{rosa ? "Elegí profesional" : "Elegí barbero"}</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {barberos.map((b) => (
                <button key={b.id} type="button" onClick={() => { setBarbero(b); setHora(""); }} className="shrink-0 p-3 w-28 text-center" style={{ background: t.card, border: barbero?.id === b.id ? `1.5px solid ${t.btn}` : `1px solid ${t.line}`, borderRadius: rosa ? 18 : 16 }}>
                  {b.foto_url ? <img src={b.foto_url} alt="" className="h-14 w-14 object-cover rounded-full mx-auto mb-2" /> : <div className="h-14 w-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: t.bg }}>{b.nombre.slice(0, 1)}</div>}
                  <p className="text-sm font-medium leading-4">{b.nombre}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {servicio && (!pideSena || metodoSena) && (
          <>
            <h2 className="font-medium mb-3">Elegí día y hora</h2>
            <div className="p-4 mb-3" style={{ background: t.card, borderRadius: rosa ? 22 : 16 }}>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
                <p className="text-sm font-medium capitalize">{mesLabel}</p>
                <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] mb-2" style={{ color: t.muted }}>{["D", "L", "M", "M", "J", "V", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
                {celdasMes.map((value, i) => {
                  if (!value) return <span key={i} />;
                  const activoDia = fecha === value;
                  const pasado = value < hoy;
                  return (
                    <button key={value} type="button" disabled={pasado} onClick={() => { setFecha(value); setHora(""); setEsperaOk(false); }} className="h-8 w-8 mx-auto rounded-full" style={{ background: activoDia ? t.btn : "transparent", color: activoDia ? t.btnText : pasado ? t.line : t.text }}>
                      {Number(value.slice(8))}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {servicio && (!pideSena || metodoSena) && fecha && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {horariosDelDia.map((h) => (
                <button key={h} type="button" onClick={() => setHora(h)} className="shrink-0 px-3 py-2 text-sm font-medium" style={{ background: hora === h ? t.btn : t.card, color: hora === h ? t.btnText : t.text, borderRadius: radio }}>{h}</button>
              ))}
            </div>
            {horariosDelDia.length === 0 && (
              <div className="mt-3">
                <p className="text-sm mb-3">No hay horarios ese día.</p>
                {esperaOk ? <p className="text-sm">Quedaste en lista de espera.</p> : (
                  <form onSubmit={anotarEspera} className="space-y-2">
                    <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full px-4 py-3" style={{ background: t.card, color: t.text, borderRadius: radio }} />
                    <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full px-4 py-3" style={{ background: t.card, color: t.text, borderRadius: radio }} />
                    <button className="w-full py-3 font-medium" style={{ background: t.btn, color: t.btnText, borderRadius: radio }}>Anotarme en lista de espera</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {servicio && (!pideSena || metodoSena) && fecha && hora && (
          <form onSubmit={guardar} className="space-y-3 mb-4">
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full px-4 py-3" style={{ background: t.card, color: t.text, borderRadius: radio }} />
            <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full px-4 py-3" style={{ background: t.card, color: t.text, borderRadius: radio }} />
            <button disabled={enviando} className="w-full py-4 font-medium" style={{ background: t.btn, color: t.btnText, borderRadius: radio }}>
              {enviando ? "Enviando..." : pideSena ? "Pedir reserva (queda pendiente de seña)" : "Confirmar reserva"}
            </button>
          </form>
        )}
      </div>
      {nav}
    </main>
  );
}

export default function ReservarPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#FDF7F9" }} />}>
      <ReservarPage />
    </Suspense>
  );
}
