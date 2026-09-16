"use client";
import Link from "next/link";

export default function PlanOk() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="max-w-sm text-center">
        <h1 className="text-3xl mb-3" style={{ fontFamily: "Georgia, Times, serif" }}>
          Pago recibido
        </h1>
        <p className="text-sm mb-8" style={{ color: "#7a7268" }}>
          El plan queda activo por 31 días. Ya podés volver a la agenda.
        </p>
        <Link href="/dashboard" className="inline-block rounded-full px-6 py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
          Ir a la agenda
        </Link>
      </div>
    </main>
  );
}
