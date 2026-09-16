"use client";
import Link from "next/link";

export default function PlanError() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="max-w-sm text-center">
        <h1 className="text-3xl mb-3" style={{ fontFamily: "Georgia, Times, serif" }}>
          No se completó el pago
        </h1>
        <p className="text-sm mb-8" style={{ color: "#7a7268" }}>
          Podés intentar de nuevo desde Configuración.
        </p>
        <Link href="/dashboard/config" className="inline-block rounded-full px-6 py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
          Volver
        </Link>
      </div>
    </main>
  );
}
