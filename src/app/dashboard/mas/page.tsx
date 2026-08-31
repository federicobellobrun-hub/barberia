"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

const items = [
  ["Nuevo turno", "/dashboard/nuevo"],
  ["Barberos", "/dashboard/barberos"],
  ["Horarios", "/dashboard/horarios"],
  ["Caja del día", "/dashboard/caja"],
  ["Galería inicio", "/dashboard/galeria"],
  ["Configuración", "/dashboard/config"],
  ["Catálogo", "/dashboard/catalogo"],
  ["Clientes", "/dashboard/clientes"],
  ["Bloqueos", "/dashboard/bloqueos"],
];

export default function MasPage() {
  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Más</h1>
        {items.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="block rounded-2xl p-4 mb-3"
            style={{ background: "var(--card)", border: "1px solid var(--line)" }}
          >
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
