"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const items = [
  ["Nuevo turno", "/dashboard/nuevo"],
  ["Horarios", "/dashboard/horarios"],
  ["Caja del día", "/dashboard/caja"],
  ["Configuración", "/dashboard/config"],
  ["Catálogo", "/dashboard/catalogo"],
  ["Clientes", "/dashboard/clientes"],
  ["Bloqueos", "/dashboard/bloqueos"],
];

export default function MasPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard">‹</Link>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>Barbershop</p>
          </div>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Más</h1>
        {items.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
