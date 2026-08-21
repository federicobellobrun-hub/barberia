"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function BrandHeader({
  left,
}: {
  left?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="w-16">{left || <span />}</div>
      <Link href="/" className="text-center">
        <p className="font-brand text-xl tracking-[0.35em] uppercase">Diano</p>
        <div className="flex items-center justify-center gap-2 my-1">
          <span className="h-px w-8" style={{ background: "var(--line)" }} />
          <span className="text-[10px]">✂</span>
          <span className="h-px w-8" style={{ background: "var(--line)" }} />
        </div>
        <p className="font-brand text-[11px] tracking-[0.28em] uppercase" style={{ color: "var(--muted)" }}>
          Barbershop
        </p>
      </Link>
      <div className="w-16 flex justify-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
