"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

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

function TiendaPage() {
  const search = useSearchParams();
  const slug = search.get("b") || "diano";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [whatsapp, setWhatsapp] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: shop, error: shopErr } = await supabase
        .from("barberias")
        .select("id, whatsapp_pedidos")
        .eq("slug", slug)
        .maybeSingle();
      if (shopErr || !shop) {
        setError("No se encontró la barbería");
        return;
      }
      setWhatsapp(shop.whatsapp_pedidos || "");
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, descripcion, stock, imagen_url")
        .eq("barberia_id", shop.id)
        .eq("activo", true)
        .order("nombre");
      if (error) setError(error.message);
      setProductos(data || []);
    };
    load();
  }, [slug]);

  const total = useMemo(
    () => carrito.reduce((acc, i) => acc + Number(i.precio) * i.cantidad, 0),
    [carrito]
  );

  const agregar = (p: Producto) => {
    setCarrito((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) return prev.map((i) => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...p, cantidad: 1 }];
    });
  };

  const quitar = (id: string) => {
    setCarrito((prev) => prev.flatMap((i) => {
      if (i.id !== id) return [i];
      if (i.cantidad <= 1) return [];
      return [{ ...i, cantidad: i.cantidad - 1 }];
    }));
  };

  const pedir = () => {
    if (!whatsapp) return setError("Esta barbería no cargó WhatsApp en Configuración");
    if (!nombre || !telefono || carrito.length === 0) return;
    const lineas = carrito.map((i) => `• ${i.cantidad} x ${i.nombre} ($${i.precio})`).join("\n");
    const texto = `Hola, soy ${nombre}. Quiero este pedido:\n\n${lineas}\n\nTotal: $${total}\nWhatsApp: ${telefono}`;
    window.open(`https://wa.me/${waNumber(whatsapp)}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <main className="min-h-screen pb-28" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Productos</h1>
        <Link href={`/b/${slug}`} className="text-sm mb-6 inline-block" style={{ color: "var(--muted)" }}>Volver</Link>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {productos.length === 0 && !error && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Esta barbería todavía no cargó productos.</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-8">
          {productos.map((p) => (
            <article key={p.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              {p.imagen_url ? (
                <img src={p.imagen_url} alt="" className="h-28 w-full object-cover" />
              ) : (
                <div className="h-28 flex items-center justify-center" style={{ background: "var(--bg)" }}>✂</div>
              )}
              <div className="p-3">
                <p className="font-medium leading-4">{p.nombre}</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>${p.precio}</p>
                <button onClick={() => agregar(p)} className="mt-2 w-full rounded-xl py-2 text-sm" style={{ background: "#1c1712", color: "#f4efe6" }}>
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </div>

        {carrito.length > 0 && (
          <section className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <h2 className="font-medium mb-3">Pedido</h2>
            {carrito.map((i) => (
              <div key={i.id} className="flex justify-between items-center mb-2 text-sm">
                <span>{i.cantidad} x {i.nombre}</span>
                <button onClick={() => quitar(i.id)}>Quitar</button>
              </div>
            ))}
            <p className="font-medium my-3">Total ${total}</p>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-xl px-3 py-3 mb-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-xl px-3 py-3 mb-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <button onClick={pedir} className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
              Pedir por WhatsApp
            </button>
          </section>
        )}
      </div>
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
