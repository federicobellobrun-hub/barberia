"use client";

import Link from "next/link";

type Item = { href: string; label: string; active?: boolean };

export default function BottomNav({ items }: { items: Item[] }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t"
      style={{ background: "var(--card)", borderColor: "var(--line)" }}
    >
      <div className="max-w-md mx-auto grid text-center" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) =>
          item.active ? (
            <span key={item.href} className="py-4 text-sm font-semibold">
              {item.label}
            </span>
          ) : (
            <Link key={item.href} href={item.href} className="py-4 text-sm" style={{ color: "var(--muted)" }}>
              {item.label}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
