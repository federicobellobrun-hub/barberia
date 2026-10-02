"use client";

import Link from "next/link";

type Item = { href: string; label: string; active?: boolean };

function Icon({ label }: { label: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.35 };
  if (label === "Inicio" || label === "Agenda") {
    return (
      <svg {...p}>
        <path d="M3 11.5 12 3l9 8.5V21H14v-6H10v6H3z" />
      </svg>
    );
  }
  if (label === "Reservar" || label === "Nuevo") {
    return (
      <svg {...p}>
        <rect x="4" y="5" width="16" height="15" rx="1" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (label === "Clientes") {
    return (
      <svg {...p}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S14 16 14.5 19" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M16 14.5c2.2.3 3.8 1.6 4.4 4" />
      </svg>
    );
  }
  if (label === "Catálogo") {
    return (
      <svg {...p}>
        <path d="M7 4h7l3 3v13H7z" />
        <path d="M14 4v4h4M9 12h6M9 16h6" />
      </svg>
    );
  }
  if (label === "Más") {
    return (
      <svg {...p}>
        <circle cx="6" cy="12" r="1.2" fill="currentColor" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        <circle cx="18" cy="12" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M7 8h10l-1.1 12H8.1L7 8z" />
      <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" />
    </svg>
  );
}

export default function BottomNav({
  items,
  bg = "#F5F0E8",
  line = "#cfc6b8",
  text = "#1C1712",
  muted = "#7a7268",
}: {
  items: Item[];
  bg?: string;
  line?: string;
  text?: string;
  muted?: string;
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: bg, borderTop: `1px solid ${line}`, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const inner = (
            <span className="flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-[0.14em]">
              <Icon label={item.label} />
              {item.label}
            </span>
          );
          return item.active ? (
            <span key={item.href} className="text-center" style={{ color: text }}>
              {inner}
            </span>
          ) : (
            <Link key={item.href} href={item.href} className="text-center" style={{ color: muted }}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
