"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";

const items = [
  { href: "/dashboard/clientes", t: "Clientes", d: "Fichas y teléfonos" },
  { href: "/dashboard/catalogo", t: "Servicios", d: "Precios y duración" },
  { href: "/dashboard/productos", t: "Productos", d: "Tienda y stock" },
  { href: "/dashboard/barberos", t: "Equipo", d: "Profesionales" },
  { href: "/dashboard/horarios", t: "Horarios", d: "Días y bloqueos" },
  { href: "/dashboard/bloqueos", t: "Bloqueos", d: "Feriados y cortes" },
  { href: "/dashboard/canina", t: "Canina", d: "Cupos de grandes y recargos" },
  { href: "/dashboard/galeria", t: "Galería", d: "Fotos" },
  { href: "/dashboard/resenas", t: "Reseñas", d: "Opiniones" },
  { href: "/dashboard/caja", t: "Caja", d: "Cobros del mes" },
  { href: "/dashboard/espera", t: "Lista de espera", d: "Si no hay turno" },
  { href: "/dashboard/config", t: "Configuración", d: "Logo, WhatsApp, plan" },
];

export default function MasPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-4">
      <BrandHeader left={<span className="font-medium">Más</span>} />
      <div className="space-y-3">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{i.t}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{i.d}</p>
          </Link>
        ))}
      </div>
      <BottomNav
        items={[
          { href: "/dashboard", label: "Agenda", active: false },
          { href: "/dashboard/clientes", label: "Clientes", active: false },
          { href: "/dashboard/catalogo", label: "Catálogo", active: false },
          { href: "/dashboard/mas", label: "Más", active: true },
        ]}
      />
    </main>
  );
}
