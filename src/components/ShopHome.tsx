"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

function Calendario() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h2M8 17h2M12 17h2" />
    </svg>
  );
}
function Bolso() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
      <path d="M4 8h16l-1.2 12H5.2L4 8zM8 8V6a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
function Persona() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5" />
    </svg>
  );
}

export default function ShopHome() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-12 pt-4">
      <BrandHeader />
      <div className="mt-2 space-y-3">
        <Link href="/reservar" className="flex items-center gap-4 rounded-2xl px-4 py-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <Calendario />
          <div>
            <p className="text-[17px] font-medium">Reservar</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Elegí día y hora</p>
          </div>
        </Link>
        <Link href="/tienda" className="flex items-center gap-4 rounded-2xl px-4 py-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <Bolso />
          <div>
            <p className="text-[17px] font-medium">Productos</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Ver el catálogo</p>
          </div>
        </Link>
        <Link href="/login" className="flex items-center gap-4 rounded-2xl px-4 py-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <Persona />
          <div>
            <p className="text-[17px] font-medium">Panel</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Dueño o equipo</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
