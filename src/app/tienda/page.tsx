"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";
import { temaRubro } from "@/lib/rubro";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
  stock: number;
  imagen_url: string | null;
};
type Item = Producto & { cantidad: number };

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

function slugDeHost() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (!host.endsWith("reservoapps.com")) return null;
  const sub = host.replace(".reservoapps.com", "");
  if (!sub || sub === "www") return null;
  return sub;
}

function TiendaPage() {
  const search = useSearchParams();
  const slug = search.get("b") || slugDeHost() || (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null) || "diano";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [whatsapp, setWhatsapp] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rubro, setRubro] = useState(() => {
    if (typeof window === "undefined") return "barberia";
    return localStorage.getItem("rubro_" + slug) || "barberia";
  });
  const t = temaRubro(rubro);
  const rosa = rubro === "pestanas_unas";
  const radio = rosa ? 999 : 16;

  useEffect(() => {
    localStorage.setItem("barberia_slug", slug);
    const load = async () => {
      const supabase = createClient();
      const { data: shop, error: shopErr } = await supabase.from("barberias").select("id, whatsapp_pedidos, rubro").eq("slug", slug).maybeSingle();
      if (shopErr || !shop) {
        setError("No se encontró el local");
        return;
      }
      setWhatsapp(shop.whatsapp_pedidos || "");
      const r = shop.rubro || "barberia";
      setRubro(r);
      localStorage.setItem("rubro_" + slug, r);
      const { data, error: e } = await supabase.from("productos").select("id, nombre, precio, descripcion, stock, imagen_url").eq("barberia_id", shop.id).eq("activo", true).order("nombre");
      if (e) setError(e.message);
      setProductos(data || []);
    };
    void load();
  }, [slug]);

  const total = useMemo(() => carrito.reduce((acc, i) => acc + Number(i.precio) * i.cantidad, 0), [carrito]);
  const agregar = (p: Producto) => {
    setCarrito((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) return prev.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...prev, { ...p, cantidad: 1 }];
    });
  };
  const quitar = (id: string) => {
    setCarrito((prev) => prev.flatMap((i) => (i.id !== id ? [i] : i.cantidad <= 1 ? [] : [{ ...i, cantidad: i.cantidad - 1 }])));
  };
  const pedir = () => {
    if (!whatsapp) return setError("Este local no cargó WhatsApp en Configuración");
    if (!nombre || !telefono || carrito.length === 0) return;
    const lineas = carrito.map((i) => `• ${i.cantidad} x ${i.nombre} ($${i.precio})`).join("\n");
    window.open(`https://wa.me/${waNumber(whatsapp)}?text=${encodeURIComponent(`Hola, soy ${nombre}. Quiero este pedido:\n\n${lineas}\n\nTotal: $${total}\nWhatsApp: ${telefono}`)}`, "_blank");
  };

  return (
    <main className="min-h-screen pb-28" style={{ background: t.bg, color: t.text }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        <h1 className="text-[34px] tracking-tight mb-2" style={{ fontFamily: "Georgia, Times, serif" }}>Productos</h1>
        <Link href={`/b/${slug}`} className="text-sm mb-6 inline-block" style={{ color: t.muted }}>Volver</Link>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {productos.length === 0 && !error && <p className="text-sm" style={{ color: t.muted }}>Este local todavía no cargó productos.</p>}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {productos.map((p) => (
            <article key={p.id} className="overflow-hidden" style={{ background: t.card, borderRadius: rosa ? 18 : 16 }}>
              {p.imagen_url ? <img src={p.imagen_url} alt="" className="h-28 w-full object-cover" /> : <div className="h-28 flex items-center justify-center text-sm" style={{ background: t.bg, color: t.muted }}>Foto</div>}
              <div className="p-3">
                <p className="font-medium leading-4">{p.nombre}</p>
                <p className="text-sm mt-1" style={{ color: t.muted }}>${p.precio}</p>
                <button onClick={() => agregar(p)} className="mt-2 w-full py-2 text-sm" style={{ background: t.btn, color: t.btnText, borderRadius: radio }}>Agregar</button>
              </div>
            </article>
          ))}
        </div>
        {carrito.length > 0 && (
          <section className="p-4" style={{ background: t.card, borderRadius: rosa ? 22 : 16 }}>
            <h2 className="font-medium mb-3">Pedido</h2>
            {carrito.map((i) => (
              <div key={i.id} className="flex justify-between items-center mb-2 text-sm">
                <span>{i.cantidad} x {i.nombre}</span>
                <button onClick={() => quitar(i.id)}>Quitar</button>
              </div>
            ))}
            <p className="font-medium my-3">Total ${total}</p>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full px-3 py-3 mb-2" style={{ background: t.bg, border: `1px solid ${t.line}`, color: t.text, borderRadius: radio }} />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full px-3 py-3 mb-3" style={{ background: t.bg, border: `1px solid ${t.line}`, color: t.text, borderRadius: radio }} />
            <button onClick={pedir} className="w-full py-3 font-medium" style={{ background: t.btn, color: t.btnText, borderRadius: radio }}>Pedir por WhatsApp</button>
          </section>
        )}
      </div>
      <BottomNav
        items={[
          { href: `/b/${slug}`, label: "Inicio" },
          { href: `/reservar?b=${slug}`, label: "Reservar" },
          { href: `/tienda?b=${slug}`, label: "Tienda", active: true },
        ]}
        bg={rosa ? "#FBF6F8" : "#F5F0E8"}
        line={t.line}
        text={t.text}
        muted={t.muted}
      />
    </main>
  );
}

export default function TiendaPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center">Cargando...</main>}>
      <TiendaPage />
    </Suspense>
  );
}
