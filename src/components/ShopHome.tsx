"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

function IcoReserva() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.2" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
    </svg>
  );
}
function IcoTienda() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M4 8h16l-1.4 11.2H5.4L4 8z" />
      <path d="M9 8V6.2A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.2V8" />
    </svg>
  );
}
function IcoPanel() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.2 19.5c.8-3.2 3.2-4.8 6.8-4.8s6 1.6 6.8 4.8" />
    </svg>
  );
}

const cards = [
  { href: "/reservar", t: "Reservar", d: "Elegí día y hora", Ico: IcoReserva },
  { href: "/tienda", t: "Productos", d: "Ver el catálogo", Ico: IcoTienda },
  { href: "/login", t: "Panel", d: "Dueño o equipo", Ico: IcoPanel },
];

export default function ShopHome() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-8 pt-2">
      <BrandHeader />
      <div className="mt-1 space-y-2.5">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-4 px-4 py-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: "10px",
            }}
          >
            <c.Ico />
            <div>
              <p className="text-[18px] leading-none" style={{ fontFamily: "Georgia, Times, serif" }}>
                {c.t}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
                {c.d}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
