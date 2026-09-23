"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

function Ico({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

const items = [
  { href: "/dashboard/clientes", t: "Clientes", d: "Fichas y teléfonos", icon: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 20c1-3.5 3.4-5 7-5s6 1.5 7 5" },
  { href: "/dashboard/catalogo", t: "Servicios", d: "Precios y duración", icon: "M7 3h10v4l2 3v12H5V10l2-3z" },
  { href: "/dashboard/productos", t: "Productos", d: "Tienda y stock", icon: "M5 8h14l-1.2 12H6.2L5 8zM9 8V6a3 3 0 0 1 6 0v2" },
  { href: "/dashboard/barberos", t: "Equipo", d: "Profesionales", icon: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 20c.8-3 2.8-4.5 5-4.5s4.2 1.5 5 4.5M14 20c.4-2 1.6-3.2 3.2-3.5" },
  { href: "/dashboard/horarios", t: "Horarios", d: "Días y bloqueos", icon: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v5l3 2" },
  { href: "/dashboard/bloqueos", t: "Bloqueos", d: "Feriados y cortes", icon: "M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3" },
  { href: "/dashboard/galeria", t: "Galería", d: "Fotos", icon: "M4 6h16v12H4zM8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 16l5-5 4 4 3-3 4 4" },
  { href: "/dashboard/resenas", t: "Reseñas", d: "Opiniones", icon: "M12 3l2.2 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.8z" },
  { href: "/dashboard/caja", t: "Caja", d: "Cobros del mes", icon: "M4 7h16v12H4zM8 7V5h8v2M8 13h8" },
  { href: "/dashboard/espera", t: "Lista de espera", d: "Si no hay turno", icon: "M5 6h14M5 12h10M5 18h7" },
  { href: "/dashboard/config", t: "Configuración", d: "Logo, WhatsApp, plan", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 12l2-1.2.4-2.3 2.3-.4L10 6l2 1.2L14.3 6l1.3 2.1 2.3.4.4 2.3L20 12l-1.2 2 1.2 2-2.1 1.3-.4 2.3-2.3.4L14 22l-2-1.2L9.7 22l-1.3-2.1-2.3-.4-.4-2.3L4 16l1.2-2z" },
];

export default function MasPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      <h1 className="mb-4 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Más</h1>
      <div className="space-y-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <Ico d={i.icon} />
            <span>
              <p className="font-medium">{i.t}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{i.d}</p>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
