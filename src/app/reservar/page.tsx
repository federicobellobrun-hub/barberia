"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  categoria: string | null;
  imagen_url: string | null;
  senia: number | null;
};
type Barbero = { id: string; nombre: string };
type Shop = {
  id: string;
  nombre: string;
  mercado_pago_url: string | null;
  datos_cuenta: string | null;
  modo_whatsapp: string | null;
};

function slugActual() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.replace(/^www\./, "");
  if (host.endsWith(".reservoapps.com")) {
    const sub = host.replace(/\.reservoapps\.com$/, "");
    if (sub && sub !== "www") return sub;
  }
  return new URLSearchParams(window.location.search).get("b") || localStorage.getItem("barberia_slug") || "";
}

function ymd(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}
function hoyStr() {
  return ymd(new Date());
}
function normCat(v: string | null) {
  if (!v) return "";
  const t = v.trim().toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}
function horaSlot(fechaHora: string) {
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
function slotsDelDia() {
  const out: string[] = [];
  for (let h = 9; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}
function slotsOcupados(fechaHora: string, duracion: number) {
  const start = new Date(fechaHora).getTime();
  const end = start + Math.max(duracion || 30, 30) * 60000;
  const out: string[] = [];
  for (let t = start; t < end; t += 30 * 60000) {
    out.push(horaSlot(new Date(t).toISOString()));
  }
  return out;
}

export default function ReservarPage() {
  const supabase = useMemo(() => createClient(), []);
  const lock = useRef(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [barbero, setBarbero] = useState("");
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pago, setPago] = useState<"mp" | "transferencia" | "">("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const slug = slugActual();
    const previo = slug ? sessionStorage.getItem(`reserva_ok_${slug}`) : null;
    if (previo) {
      setOk(previo);
      return;
    }
    const load = async () => {
      if (!slug) return;
      localStorage.setItem("barberia_slug", slug);
      const { data: s } = await supabase
        .from("barberias")
        .select("id, nombre, mercado_pago_url, datos_cuenta, modo_whatsapp")
        .eq("slug", slug)
        .maybeSingle();
      if (!s) return;
      setShop(s as Shop);
      const { data: serv } = await supabase
        .from("servicios")
        .select("id, nombre, precio, duracion_minutos, categoria, imagen_url, senia")
        .eq("barberia_id", s.id)
        .eq("activo", true);
      setServicios((serv as Servicio[]) || []);
      const { data: b } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", s.id);
      setBarberos((b as Barbero[]) || []);
    };
    void load();
  }, [supabase]);

  useEffect(() => {
    const loadHoras = async () => {
      if (!shop || !fecha) {
        setOcupados([]);
        return;
      }
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      let q = supabase
        .from("turnos")
        .select("fecha_hora, duracion_minutos")
        .eq("barberia_id", shop.id)
        .gte("fecha_hora", desde)
        .lte("fecha_hora", hasta)
        .in("estado", ["pendiente", "confirmado"]);
      if (barbero) q = q.eq("barbero_id", barbero);
      const { data } = await q;
      const hours = new Set<string>();
      (data || []).forEach((t) => {
        slotsOcupados(t.fecha_hora, Number(t.duracion_minutos) || 30).forEach((h) => hours.add(h));
      });
      setOcupados(Array.from(hours));
      setHora("");
    };
    void loadHoras();
  }, [shop, fecha, barbero, supabase]);

  const categorias = useMemo(() => {
    const map = new Map<string, { n: number; foto: string | null }>();
    servicios.forEach((s) => {
      const name = normCat(s.categoria);
      if (!name) return;
      const prev = map.get(name) || { n: 0, foto: null };
      map.set(name, { n: prev.n + 1, foto: prev.foto || s.imagen_url });
    });
    return Array.from(map.entries());
  }, [servicios]);

  const usarCat = categorias.length > 0;
  const lista = usarCat && categoria ? servicios.filter((x) => normCat(x.categoria) === categoria) : servicios;
  const pideSenia = Boolean(servicio?.senia && Number(servicio.senia) > 0);
  const manual = (shop?.modo_whatsapp || "") !== "automatico";
  const horasLibres = slotsDelDia().filter((h) => !ocupados.includes(h));

  const celdas = useMemo(() => {
    const first = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const start = first.getDay();
    const days = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const arr: { n: number | null; value: string | null; past: boolean }[] = [];
    for (let i = 0; i < start; i++) arr.push({ n: null, value: null, past: true });
    const hoy = hoyStr();
    for (let n = 1; n <= days; n++) {
      const value = ymd(new Date(mes.getFullYear(), mes.getMonth(), n));
      arr.push({ n, value, past: value < hoy });
    }
    return arr;
  }, [mes]);
  const mesLabel = mes.toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  const clienteId = async () => {
    if (!shop) throw new Error("Sin local");
    const tel = telefono.replace(/\D/g, "");
    const { data: ya } = await supabase.from("clientes").select("id").eq("barberia_id", shop.id).eq("telefono", tel).maybeSingle();
    if (ya?.id) {
      await supabase.from("clientes").update({ nombre }).eq("id", ya.id);
      return ya.id;
    }
    const { data: nuevo, error } = await supabase.from("clientes").insert({ barberia_id: shop.id, nombre, telefono: tel }).select("id").single();
    if (error || !nuevo) throw new Error(error?.message || "No se pudo guardar el cliente");
    return nuevo.id;
  };

  const reservar = async () => {
    setError("");
    if (lock.current || enviando) return;
    if (!shop || !servicio || !fecha || !hora || !nombre || !telefono) return setError("Completá los datos");
    if (pideSenia && !pago) return setError("Elegí cómo pagás la seña");
    lock.current = true;
    setEnviando(true);
    const pendiente = manual || pideSenia;
    const mensaje = pendiente ? "Pedido enviado. El local lo confirma en la agenda." : "Reserva confirmada";
    const desde = new Date(`${fecha}T${hora}:00-03:00`);
    const hasta = new Date(desde.getTime() + 60 * 1000);
    try {
      const cid = await clienteId();
      const { data: existentes } = await supabase
        .from("turnos")
        .select("id")
        .eq("barberia_id", shop.id)
        .eq("cliente_id", cid)
        .gte("fecha_hora", desde.toISOString())
        .lt("fecha_hora", hasta.toISOString())
        .in("estado", ["pendiente", "confirmado"])
        .limit(1);

      let turnoId = existentes?.[0]?.id as string | undefined;
      if (!turnoId) {
        const { data: turno, error } = await supabase
          .from("turnos")
          .insert({
            barberia_id: shop.id,
            cliente_id: cid,
            servicio_id: servicio.id,
            barbero_id: barbero || null,
            fecha_hora: desde.toISOString(),
            duracion_minutos: servicio.duracion_minutos,
            estado: pendiente ? "pendiente" : "confirmado",
            senia_monto: pideSenia ? Number(servicio.senia) : 0,
            senia_metodo: pideSenia ? pago : null,
            senia_pagada: false,
            cliente_nombre: nombre,
          })
          .select("id")
          .single();
        if (error || !turno) throw new Error(error?.message || "No se pudo reservar");
        turnoId = turno.id;
      }

      const slug = slugActual();
      if (slug) sessionStorage.setItem(`reserva_ok_${slug}`, mensaje);
      setOk(mensaje);
      void fetch("/api/whatsapp/reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoId }),
      });
    } catch (e) {
      lock.current = false;
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setEnviando(false);
    }
  };

  if (ok) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <BrandHeader />
        <p className="mt-8 text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>{ok}</p>
        {pideSenia && pago === "transferencia" && shop?.datos_cuenta && (
          <p className="mt-4 text-sm">Transferí ${servicio?.senia} a:<br />{shop.datos_cuenta}</p>
        )}
        {pideSenia && pago === "mp" && shop?.mercado_pago_url && (
          <a href={shop.mercado_pago_url} target="_blank" rel="noreferrer" className="mt-5 inline-block px-6 py-3" style={{ background: "var(--text)", color: "var(--bg)", borderRadius: 999 }}>
            Ir a pagar la seña
          </a>
        )}
        <button
          type="button"
          className="mt-6 underline"
          onClick={() => {
            const slug = slugActual();
            if (slug) sessionStorage.removeItem(`reserva_ok_${slug}`);
            window.location.href = "/";
          }}
        >
          Volver
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {usarCat && !categoria && !servicio && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Elegí una categoría</p>
          {categorias.map(([c, info]) => (
            <button key={c} onClick={() => setCategoria(c)} className="group flex w-full items-center gap-3 overflow-hidden px-2 py-2 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14 }}>
              <span className="h-14 w-14 shrink-0 overflow-hidden" style={{ borderRadius: 10, background: "var(--line)" }}>
                {info.foto ? <img src={info.foto} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-lg">{c.slice(0, 1)}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>{c}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{info.n} servicio{info.n > 1 ? "s" : ""}</p>
              </span>
            </button>
          ))}
        </div>
      )}

      {((usarCat && categoria) || !usarCat) && !servicio && (
        <div>
          {usarCat && <button onClick={() => setCategoria(null)} className="mb-3 text-sm underline">← Categorías</button>}
          <div className="space-y-3">
            {lista.map((s) => (
              <button key={s.id} onClick={() => setServicio(s)} className="flex w-full gap-3 px-3 py-3 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
                {s.imagen_url && <img src={s.imagen_url} alt="" className="h-16 w-16 object-cover" style={{ borderRadius: 8 }} />}
                <span>
                  <p className="font-medium">{s.nombre}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>${s.precio} · {s.duracion_minutos} min {s.senia ? `· seña $${s.senia}` : ""}</p>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {servicio && (
        <div>
          <button onClick={() => setServicio(null)} className="mb-3 text-sm underline">← Cambiar servicio</button>
          <p className="text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>{servicio.nombre}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>${servicio.precio} · {servicio.duracion_minutos} min</p>
          {pideSenia && <p className="mt-2 text-sm">Seña ${servicio.senia}. El turno queda pendiente hasta que el local confirme el pago.</p>}

          {barberos.length > 1 && (
            <select value={barbero} onChange={(e) => setBarbero(e.target.value)} className="mt-4 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <option value="">Cualquiera</option>
              {barberos.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          )}

          <div className="mt-6">
            <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>Seleccionar día</p>
            <div className="flex items-center justify-between px-2">
              <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
              <p className="capitalize" style={{ fontFamily: "Georgia, Times, serif" }}>{mesLabel}</p>
              <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="mt-3 grid grid-cols-7 text-center text-[11px]" style={{ color: "var(--muted)" }}>
              {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-2 text-center text-sm">
              {celdas.map((c, i) =>
                !c.n ? <span key={i} /> : (
                  <button key={c.value} type="button" disabled={c.past} onClick={() => setFecha(c.value!)} className="mx-auto flex h-9 w-9 items-center justify-center" style={{ borderRadius: 999, opacity: c.past ? 0.28 : 1, background: fecha === c.value ? "var(--text)" : "transparent", color: fecha === c.value ? "var(--bg)" : "inherit" }}>
                    {c.n}
                  </button>
                )
              )}
            </div>
          </div>

          {fecha && (
            <div className="mt-6">
              <p className="mb-3 text-sm">Horarios disponibles para {fecha.slice(8)}/{fecha.slice(5, 7)}</p>
              {horasLibres.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No hay turnos ese día.</p>}
              <div className="flex flex-wrap gap-2">
                {horasLibres.map((h) => (
                  <button key={h} type="button" onClick={() => setHora(h)} className="min-w-[88px] rounded-xl px-4 py-2 text-sm" style={{ border: "1px solid var(--line)", background: hora === h ? "var(--text)" : "var(--card)", color: hora === h ? "var(--bg)" : "inherit" }}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="mt-5 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }} />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="mt-3 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }} />

          {pideSenia && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">¿Cómo pagás la seña de ${servicio?.senia}?</p>
              <button type="button" onClick={() => setPago("mp")} className="w-full rounded-xl py-3 text-sm" style={{ border: "1px solid var(--line)", background: pago === "mp" ? "var(--text)" : "var(--card)", color: pago === "mp" ? "var(--bg)" : "inherit" }}>Mercado Pago</button>
              <button type="button" onClick={() => setPago("transferencia")} className="w-full rounded-xl py-3 text-sm" style={{ border: "1px solid var(--line)", background: pago === "transferencia" ? "var(--text)" : "var(--card)", color: pago === "transferencia" ? "var(--bg)" : "inherit" }}>Transferencia</button>
            </div>
          )}

          <button type="button" onClick={() => void reservar()} disabled={enviando} className="mt-4 w-full py-3" style={{ background: "var(--text)", color: "var(--bg)", borderRadius: 999, opacity: enviando ? 0.5 : 1 }}>
            {enviando ? "Enviando..." : pideSenia || manual ? "Pedir reserva" : "Confirmar reserva"}
          </button>
        </div>
      )}
    </main>
  );
}
