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
type Shop = {
  id: string;
  nombre: string;
  mp_sena_url: string | null;
  cuenta_banco: string | null;
  whatsapp_pedidos: string | null;
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

export default function ReservarPage() {
  const supabase = createClient();
  const [shop, setShop] = useState<Shop | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [barbero, setBarbero] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pago, setPago] = useState<"mp" | "transferencia" | "">("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const slug = slugActual();
      if (!slug) return;
      localStorage.setItem("barberia_slug", slug);
      const { data: s } = await supabase
        .from("barberias")
        .select("id, nombre, mp_sena_url, cuenta_banco, whatsapp_pedidos")
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

  const categorias = useMemo(() => {
    const set = new Set(servicios.map((x) => x.categoria).filter(Boolean) as string[]);
    return Array.from(set);
  }, [servicios]);
  const usarCat = categorias.length > 0;
  const lista = usarCat && categoria ? servicios.filter((x) => x.categoria === categoria) : servicios;
  const pideSenia = Boolean(servicio?.senia && Number(servicio.senia) > 0);

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
    if (!shop || !servicio || !fecha || !hora || !nombre || !telefono) {
      setError("Completá los datos");
      return;
    }
    if (pideSenia && !pago) {
      setError("Elegí cómo pagás la seña");
      return;
    }
    try {
      const cid = await clienteId();
      const { data: turno, error } = await supabase
        .from("turnos")
        .insert({
          barberia_id: shop.id,
          cliente_id: cid,
          servicio_id: servicio.id,
          barbero_id: barbero || null,
          fecha_hora: new Date(`${fecha}T${hora}:00-03:00`).toISOString(),
          duracion_minutos: servicio.duracion_minutos,
          estado: pideSenia ? "pendiente" : "confirmado",
          senia_monto: pideSenia ? Number(servicio.senia) : 0,
          senia_metodo: pideSenia ? pago : null,
          senia_pagada: false,
        })
        .select("id")
        .single();
      if (error || !turno) throw new Error(error?.message || "No se pudo reservar");
      await fetch("/api/whatsapp/reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoId: turno.id }),
      });
      if (pideSenia && pago === "mp" && shop.mp_sena_url) {
        window.location.href = shop.mp_sena_url;
        return;
      }
      setOk(pideSenia ? "Reserva pedida. Queda pendiente hasta que confirmen la seña." : "Reserva confirmada");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  if (ok) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <BrandHeader />
        <p className="mt-8 text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>{ok}</p>
        {pideSenia && pago === "transferencia" && shop?.cuenta_banco && (
          <p className="mt-4 text-sm">Transferí ${servicio?.senia} a:<br />{shop.cuenta_banco}</p>
        )}
        <Link href="/" className="mt-6 inline-block underline">Volver</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {usarCat && !categoria && !servicio && (
        <div className="space-y-3">
          {categorias.map((c) => (
            <button key={c} onClick={() => setCategoria(c)} className="block w-full px-4 py-5 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>{c}</p>
            </button>
          ))}
        </div>
      )}

      {((usarCat && categoria) || !usarCat) && !servicio && (
        <div>
          {usarCat && (
            <button onClick={() => setCategoria(null)} className="mb-3 text-sm underline">← Categorías</button>
          )}
          <div className="space-y-3">
            {lista.map((s) => (
              <button key={s.id} onClick={() => setServicio(s)} className="flex w-full gap-3 px-3 py-3 text-left" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
                {s.imagen_url && <img src={s.imagen_url} alt="" className="h-16 w-16 object-cover" style={{ borderRadius: 8 }} />}
                <span>
                  <p className="font-medium">{s.nombre}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    ${s.precio} · {s.duracion_minutos} min {s.senia ? `· seña $${s.senia}` : ""}
                  </p>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {servicio && (
        <div>
          <button onClick={() => setServicio(null)} className="mb-3 text-sm underline">← Servicios</button>
          <p className="text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>{servicio.nombre}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>${servicio.precio} · {servicio.duracion_minutos} min</p>
          {pideSenia && <p className="mt-2 text-sm">Este servicio pide seña de ${servicio.senia}. La reserva se confirma cuando Vale la reciba.</p>}

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

          {pideSenia && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">¿Cómo pagás la seña?</p>
              <button type="button" onClick={() => setPago("mp")} className="w-full rounded-xl py-3 text-sm" style={{ border: "1px solid var(--line)", background: pago === "mp" ? "var(--text)" : "var(--card)", color: pago === "mp" ? "var(--bg)" : "inherit" }}>
                Mercado Pago
              </button>
              <button type="button" onClick={() => setPago("transferencia")} className="w-full rounded-xl py-3 text-sm" style={{ border: "1px solid var(--line)", background: pago === "transferencia" ? "var(--text)" : "var(--card)", color: pago === "transferencia" ? "var(--bg)" : "inherit" }}>
                Transferencia
              </button>
            </div>
          )}

          <button onClick={() => void reservar()} className="mt-4 w-full py-3" style={{ background: "var(--text)", color: "var(--bg)", borderRadius: 999 }}>
            {pideSenia ? "Pedir reserva" : "Confirmar reserva"}
          </button>
        </div>
      )}
    </main>
  );
}
