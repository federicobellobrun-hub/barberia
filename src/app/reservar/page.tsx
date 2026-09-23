"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import ReservaCanina from "@/components/ReservaCanina";

type Shop = {
  id: string;
  nombre: string;
  slug: string;
  rubro: string | null;
  whatsapp_pedidos?: string | null;
  modo_whatsapp?: string | null;
  canina_cupo_grande_manana?: number | null;
  canina_cupo_grande_tarde?: number | null;
  canina_un_grande_por_dia?: boolean | null;
};
type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  categoria?: string | null;
  activo?: boolean;
};
type Barbero = { id: string; nombre: string };

function slugActual() {
  if (typeof window === "undefined") return "diano";
  const host = window.location.hostname.replace(/^www\./, "");
  if (host.endsWith(".reservoapps.com")) {
    const sub = host.replace(/\.reservoapps\.com$/, "");
    if (sub && sub !== "www") return sub;
  }
  const q = new URLSearchParams(window.location.search).get("b");
  if (q) return q;
  const path = window.location.pathname;
  if (path.startsWith("/b/")) return path.split("/")[2];
  return localStorage.getItem("barberia_slug") || "diano";
}

function horaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });
}

const HORAS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

export default function ReservarPage() {
  const supabase = createClient();
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicioId, setServicioId] = useState("");
  const [barberoId, setBarberoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [ocupadas, setOcupadas] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const slug = slugActual();
      localStorage.setItem("barberia_slug", slug);
      const { data, error: e } = await supabase
        .from("barberias")
        .select("id, nombre, slug, rubro, whatsapp_pedidos, modo_whatsapp, canina_cupo_grande_manana, canina_cupo_grande_tarde, canina_un_grande_por_dia")
        .eq("slug", slug)
        .maybeSingle();
      if (e) setError(e.message);
      if (!data) {
        setError("No se encontró la barbería");
        return;
      }
      setShop(data as Shop);
      const { data: s } = await supabase.from("servicios").select("id, nombre, precio, duracion_minutos, categoria, activo").eq("barberia_id", data.id).eq("activo", true);
      setServicios((s as Servicio[]) || []);
      const { data: b } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", data.id).order("nombre");
      setBarberos((b as Barbero[]) || []);
    };
    void load();
  }, [supabase]);

  useEffect(() => {
    if (!shop || !fecha) return;
    const load = async () => {
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      let q = supabase
        .from("turnos")
        .select("fecha_hora")
        .eq("barberia_id", shop.id)
        .gte("fecha_hora", desde)
        .lte("fecha_hora", hasta)
        .in("estado", ["pendiente", "confirmado", "realizado"]);
      if (barberoId) q = q.eq("barbero_id", barberoId);
      const { data } = await q;
      setOcupadas((data || []).map((t) => horaUy(t.fecha_hora)));
    };
    void load();
  }, [shop, fecha, barberoId, supabase]);

  const servicio = servicios.find((s) => s.id === servicioId);
  const categorias = useMemo(() => {
    const set = new Set(servicios.map((s) => s.categoria).filter(Boolean) as string[]);
    return Array.from(set);
  }, [servicios]);
  const [cat, setCat] = useState("");
  const lista = cat ? servicios.filter((s) => s.categoria === cat) : servicios;
  const libres = HORAS.filter((h) => !ocupadas.includes(h));

  const reservar = async () => {
    if (!shop || !servicio || !fecha || !hora || !nombre || !telefono) {
      setMsg("Completá todos los datos");
      return;
    }
    setMsg("");
    const { data: cli, error: e1 } = await supabase
      .from("clientes")
      .insert({ barberia_id: shop.id, nombre, telefono })
      .select("id")
      .single();
    if (e1 || !cli) {
      const { data: exist } = await supabase.from("clientes").select("id").eq("barberia_id", shop.id).eq("telefono", telefono).maybeSingle();
      if (!exist) {
        setMsg(e1?.message || "No se pudo guardar el cliente");
        return;
      }
      await crearTurno(exist.id);
      return;
    }
    await crearTurno(cli.id);
  };

  const crearTurno = async (clienteId: string) => {
    if (!shop || !servicio || !fecha || !hora) return;
    const { data: turno, error } = await supabase
      .from("turnos")
      .insert({
        barberia_id: shop.id,
        cliente_id: clienteId,
        servicio_id: servicio.id,
        barbero_id: barberoId || null,
        fecha_hora: new Date(`${fecha}T${hora}:00-03:00`).toISOString(),
        duracion_minutos: servicio.duracion_minutos || 30,
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Reserva lista");
    if (turno?.id) {
      fetch("/api/whatsapp/reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: turno.id }),
      }).catch(() => null);
    }
  };

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <p>{error}</p>
      </main>
    );
  }
  if (!shop) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <p>Cargando reserva...</p>
      </main>
    );
  }

  if (shop.rubro === "canina") {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-4">
        <BrandHeader />
        <ReservaCanina
          shop={{
            id: shop.id,
            nombre: shop.nombre,
            canina_cupo_grande_manana: shop.canina_cupo_grande_manana ?? 1,
            canina_cupo_grande_tarde: shop.canina_cupo_grande_tarde ?? 1,
            canina_un_grande_por_dia: shop.canina_un_grande_por_dia ?? false,
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-4">
      <BrandHeader />
      <h1 className="mb-4 text-xl">Reservar</h1>

      {categorias.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button onClick={() => setCat("")} className="rounded-full px-3 py-1.5 text-sm" style={{ background: !cat ? "#1A1612" : "var(--card)", color: !cat ? "#F6F1E8" : "inherit" }}>
            Todos
          </button>
          {categorias.map((c) => (
            <button key={c} onClick={() => setCat(c)} className="rounded-full px-3 py-1.5 text-sm" style={{ background: cat === c ? "#1A1612" : "var(--card)", color: cat === c ? "#F6F1E8" : "inherit" }}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 space-y-2">
        {lista.map((s) => (
          <button
            key={s.id}
            onClick={() => setServicioId(s.id)}
            className="block w-full rounded-2xl p-3 text-left"
            style={{ border: servicioId === s.id ? "2px solid #1A1612" : "1px solid var(--line)", background: "var(--card)" }}
          >
            <p className="font-medium">{s.nombre}</p>
            <p className="text-sm">${s.precio} · {s.duracion_minutos} min</p>
          </button>
        ))}
      </div>

      {barberos.length > 1 && (
        <select className="mb-3 w-full rounded-xl px-3 py-2" value={barberoId} onChange={(e) => setBarberoId(e.target.value)}>
          <option value="">Cualquier profesional</option>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
      )}

      <input className="mb-3 w-full rounded-xl px-3 py-2" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <div className="mb-4 flex flex-wrap gap-2">
        {libres.map((h) => (
          <button key={h} onClick={() => setHora(h)} className="rounded-full px-3 py-1.5 text-sm" style={{ background: hora === h ? "#1A1612" : "var(--card)", color: hora === h ? "#F6F1E8" : "inherit" }}>
            {h}
          </button>
        ))}
      </div>
      <input className="mb-2 w-full rounded-xl px-3 py-2" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input className="mb-4 w-full rounded-xl px-3 py-2" placeholder="WhatsApp" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      <button onClick={() => void reservar()} className="w-full rounded-full py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
        Confirmar reserva
      </button>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
