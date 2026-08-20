"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

const WHATSAPP_PEDIDOS = "59897344643";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
};

type Item = Producto & { cantidad: number };

export default function TiendaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, descripcion")
        .eq("activo", true)
        .order("nombre");
      if (error) setError(error.message);
      setProductos(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const agregar = (p: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((x) => x.id === p.id);
      if (existe) return prev.map((x) => x.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x);
      return [...prev, { ...p, cantidad: 1 }];
    });
  };

  const quitar = (id: string) => {
    setCarrito((prev) =>
      prev
        .map((x) => x.id === id ? { ...x, cantidad: x.cantidad - 1 } : x)
        .filter((x) => x.cantidad > 0)
    );
  };

  const total = useMemo(
    () => carrito.reduce((acc, i) => acc + Number(i.precio) * i.cantidad, 0),
    [carrito]
  );

  const comprar = (e: React.FormEvent) => {
    e.preventDefault();
    if (carrito.length === 0) return setError("Agregá al menos un producto");
    const lineas = carrito
      .map((i) => `• ${i.nombre} x${i.cantidad} — $${Number(i.precio) * i.cantidad}`)
      .join("\n");
    const texto = `Hola, quiero hacer este pedido en Diano Barbershop:\n\n${lineas}\n\nTotal: $${total}\nNombre: ${nombre}\nWhatsApp: ${telefono}`;
    window.open(`https://wa.me/${WHATSAPP_PEDIDOS}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/">‹</Link>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>Barbershop</p>
          </div>
          <ThemeToggle />
        </header>

        <h1 className="text-[34px] font-semibold tracking-tight leading-9">Productos</h1>
        <p className="mt-2 mb-6" style={{ color: "var(--muted)" }}>Armá el pedido y envialo por WhatsApp</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {loading && <p style={{ color: "var(--muted)" }}>Cargando...</p>}

        {productos.map((p) => (
          <div key={p.id} className="rounded-2xl p-4 mb-3 flex items-center justify-between gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div>
              <p className="font-medium">{p.nombre}</p>
              {p.descripcion && <p className="text-sm" style={{ color: "var(--muted)" }}>{p.descripcion}</p>}
              <p className="text-sm mt-1">${p.precio}</p>
            </div>
            <button
              onClick={() => agregar(p)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium"
              style={{ background: "#1d1d1f", color: "#fff" }}
            >
              Agregar
            </button>
          </div>
        ))}

        {productos.length === 0 && !loading && (
          <p style={{ color: "var(--muted)" }}>Todavía no hay productos cargados.</p>
        )}

        {carrito.length > 0 && (
          <section className="mt-8">
            <h2 className="font-medium mb-3">Carrito</h2>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              {carrito.map((i) => (
                <div key={i.id} className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--line)" }}>
                  <div>
                    <p>{i.nombre}</p>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>x{i.cantidad} · ${Number(i.precio) * i.cantidad}</p>
                  </div>
                  <button onClick={() => quitar(i.id)} className="text-sm" style={{ color: "var(--muted)" }}>Quitar</button>
                </div>
              ))}
              <div className="px-4 py-3 flex justify-between font-medium">
                <span>Total</span>
                <span>${total}</span>
              </div>
            </div>

            <form onSubmit={comprar} className="space-y-3">
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full rounded-2xl px-4 py-3 outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}
              />
              <input
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Tu WhatsApp"
                className="w-full rounded-2xl px-4 py-3 outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}
              />
              <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>
                Comprar por WhatsApp
              </button>
            </form>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
        <div className="max-w-md mx-auto grid grid-cols-3 text-center text-xs py-3">
          <Link href="/" style={{ color: "var(--muted)" }}>Inicio</Link>
          <Link href="/reservar" style={{ color: "var(--muted)" }}>Reservar</Link>
          <span className="font-medium">Tienda</span>
        </div>
      </nav>
    </main>
  );
}
