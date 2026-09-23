"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function slugActual() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.replace(/^www\./, "");
  if (host.endsWith(".reservoapps.com")) {
    const sub = host.replace(/\.reservoapps\.com$/, "");
    if (sub && sub !== "www") return sub;
  }
  return new URLSearchParams(window.location.search).get("b") || localStorage.getItem("barberia_slug") || "";
}

export default function ReservarPage() {
  const supabase = createClient();
  const [shopId, setShopId] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [barbero, setBarbero] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const slug = slugActual();
      if (!slug) return;
      localStorage.setItem("barberia_slug", slug);
      const { data: shop } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
      if (!shop) return;
      setShopId(shop.id);
      const { data: s } = await supabase.from("servicios").select("id, nombre, precio, duracion_minutos, categoria, imagen_url, senia").eq("barberia_id", shop.id).eq("activo", true);
      setServicios((s as Servicio[]) || []);
      const { data: b } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", shop.id).eq("activo", true);
      setBarberos((b as Barbero[]) || []);
    };
    void load();
  }, [supabase]);

  const categorias = useMemo(() => {
    const set = new Set(servicios.map((s) => s.categoria).filter(Boolean) as string[]);
    return Array.from(set);
  }, [servicios]);

  const usarCategorias = categorias.length > 0;
  const lista = usarCategorias && categoria ? servicios.filter((s) => s.categoria === categoria) : servicios;

  const reservar = async () => {
    setError("");
    if (!servicio || !fecha || !hora || !nombre || !telefono) {
      setError("Completá los datos");
      return;
    }
    const { data: cli, error: e1 } = await supabase.from("clientes").insert({ barberia_id: shopId, nombre, telefono }).select("id").single();
    if (e1 || !cli) {
      setError(e1?.message || "No se pudo crear el cliente");
      return;
    }
    const { data: turno, error: e2 } = await supabase
      .from("turnos")
      .insert({
        barberia_id: shopId,
        cliente_id: cli.id,
        servicio_id: servicio.id,
        barbero_id: barbero || null,
        fecha_hora: new Date(`${fecha}T${hora}:00-03:00`).toISOString(),
        duracion_minutos: servicio.duracion_minutos,
        estado: servicio.senia && servicio.senia > 0 ? "pendiente" : "confirmado",
      })
      .select("id")
      .single();
    if (e2 || !turno) {
      setError(e2?.message || "No se pudo reservar");
      return;
    }
    await fetch("/api/whatsapp/reserva", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turnoId: turno.id }) });
    setOk("Reserva enviada");
  };

  if (ok) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <BrandHeader />
        <p className="mt-8 text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>{ok}</p>
        <Link href="/" className="mt-6 inline-block underline">Volver</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {usarCategorias && !categoria && !servicio && (
        <div className="space-y-3">
          <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>Elegí una categoría</p>
          {categorias.map((c) => (
            <button key={c} onClick={() => setCategoria(c)} className="block w-full px-4 py-5 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>{c}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{servicios.filter((s) => s.categoria === c).length} servicios</p>
            </button>
          ))}
        </div>
      )}

      {usarCategorias && categoria && !servicio && (
        <div className="animate-[slide_.35s_ease]">
          <button onClick={() => setCategoria(null)} className="mb-3 text-sm underline">← Categorías</button>
          <div className="space-y-3">
            {lista.map((s) => (
              <button key={s.id} onClick={() => setServicio(s)} className="flex w-full gap-3 px-3 py-3 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
                {s.imagen_url && <img src={s.imagen_url} alt="" className="h-16 w-16 object-cover" style={{ borderRadius: 8 }} />}
                <span>
                  <p className="font-medium">{s.nombre}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>${s.precio} · {s.duracion_minutos} min</p>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!usarCategorias && !servicio && (
        <div className="space-y-3">
          {servicios.map((s) => (
            <button key={s.id} onClick={() => setServicio(s)} className="flex w-full gap-3 px-3 py-3 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
              {s.imagen_url && <img src={s.imagen_url} alt="" className="h-16 w-16 object-cover" style={{ borderRadius: 8 }} />}
              <span>
                <p className="font-medium">{s.nombre}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>${s.precio} · {s.duracion_minutos} min</p>
              </span>
            </button>
          ))}
        </div>
      )}

      {servicio && (
        <div>
          <button
            onClick={() => {
              setServicio(null);
              if (!usarCategorias) setCategoria(null);
            }}
            className="mb-3 text-sm underline"
          >
            ← Servicios
          </button>
          {servicio.imagen_url && <img src={servicio.imagen_url} alt="" className="mb-3 h-40 w-full object-cover" style={{ borderRadius: 12 }} />}
          <p className="text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>{servicio.nombre}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>${servicio.precio} · {servicio.duracion_minutos} min</p>
          {servicio.senia ? <p className="mt-2 text-sm">Requiere seña ${servicio.senia}</p> : null}

          {barberos.length > 1 && (
            <select value={barbero} onChange={(e) => setBarbero(e.target.value)} className="mt-4 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <option value="">Cualquiera</option>
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          )}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-3 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }} />
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="mt-3 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }} />
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="mt-3 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }} />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="mt-3 w-full rounded-xl px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }} />
          <button onClick={reservar} className="mt-4 w-full py-3" style={{ background: "#1A1612", color: "#F6F1E8", borderRadius: 999 }}>
            Confirmar reserva
          </button>
        </div>
      )}

      <style>{`@keyframes slide { from { transform: translateX(24px); opacity:.4 } to { transform:none; opacity:1 } }`}</style>
    </main>
  );
}
