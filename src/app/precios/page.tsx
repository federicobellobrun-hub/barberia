"use client";

import Link from "next/link";

export default function PreciosPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-10">
        <Link href="/" className="text-sm text-[#7a7268]">
          ← Reservo Apps
        </Link>
        <h1 className="mt-6 text-4xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Precios
        </h1>
        <p className="mt-3 text-sm text-[#7a7268]">
          7 días de prueba. Después el mes se paga por Mercado Pago o transferencia.
        </p>

        <article className="mt-8 rounded-2xl p-5" style={{ background: "#EFE8DC" }}>
          <p className="text-[11px] tracking-[0.16em] uppercase text-[#7a7268]">Manual</p>
          <p className="mt-2 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
            $ 890 <span className="text-base">/ mes</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-[#6f675e]">
            Agenda, clientes, seña, tienda y lista de espera. El local avisa por su WhatsApp.
          </p>
        </article>

        <article className="mt-3 rounded-2xl p-5" style={{ background: "#1C1712", color: "#F5F0E8" }}>
          <p className="text-[11px] tracking-[0.16em] uppercase text-[#c4b8a8]">Automático</p>
          <p className="mt-2 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
            $ 1.490 <span className="text-base">/ mes</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-[#c4b8a8]">
            Todo lo del manual más confirmación, recordatorio, cancelación y aviso al local por WhatsApp Business.
          </p>
          <p className="mt-3 text-xs text-[#9a9388]">
            Los mensajes de WhatsApp los factura Meta aparte, según su tarifa.
          </p>
        </article>

        <p className="mt-6 text-xs leading-5 text-[#7a7268]">
          Precios en pesos uruguayos. Seña y productos los cobra el local, no Reservo.
        </p>
        <Link href="/probar" className="mt-8 block rounded-full py-4 text-center text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
          Empezar prueba
        </Link>
      </div>
    </main>
  );
}
