"use client";

import Link from "next/link";

type Item = { href: string; label: string; active?: boolean };

function Icon({ label }: { label: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (label === "Inicio") {
    return (
      <svg {...common}>
        <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" />
      </svg>
    );
  }
  if (label === "Reservar") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (label === "Tienda") {
    return (
      <svg {...common}>
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      </svg>
    );
  }
  return null;
}

export default function BottomNav({ items }: { items: Item[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0" style={{ background: "#F5F0E8", borderTop: "1px solid #ddd4c8" }}>
      <div className="max-w-md mx-auto grid text-center" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const inner = (
            <span className="flex flex-col items-center gap-1 py-3 text-[11px] tracking-[0.06em]">
              <Icon label={item.label} />
              {item.label}
            </span>
          );
          return item.active ? (
            <span key={item.href} style={{ color: "#1C1712" }}>
              {inner}
            </span>
          ) : (
            <Link key={item.href} href={item.href} style={{ color: "#7a7268" }}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
