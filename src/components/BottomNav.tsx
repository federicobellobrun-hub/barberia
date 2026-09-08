"use client";

import Link from "next/link";

type Item = { href: string; label: string; active?: boolean };

function Icon({ label }: { label: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.35 };
  if (label === "Inicio") {
    return (
      <svg {...p}>
        <path d="M3 11.5 12 3l9 8.5V21H14v-6H10v6H3z" />
      </svg>
    );
  }
  if (label === "Reservar") {
    return (
      <svg {...p}>
        <rect x="4" y="5" width="16" height="15" rx="1" />
        <path d="M8 3v4M16 3v4M4 10h16" />
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

export default function BottomNav({ items }: { items: Item[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0" style={{ background: "#F5F0E8", borderTop: "1px solid #cfc6b8" }}>
      <div className="max-w-md mx-auto grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const inner = (
            <span className="flex flex-col items-center gap-1 py-3 text-[10px] tracking-[0.14em] uppercase">
              <Icon label={item.label} />
              {item.label}
            </span>
          );
          return item.active ? (
            <span key={item.href} className="text-center" style={{ color: "#1C1712" }}>
              {inner}
            </span>
          ) : (
            <Link key={item.href} href={item.href} className="text-center" style={{ color: "#7a7268" }}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
