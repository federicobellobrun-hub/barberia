"use client";

import Link from "next/link";

export default function TerminosPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-10 text-sm leading-6">
        <Link href="/" className="text-[#7a7268]">
          ← Reservo Apps
        </Link>
        <h1 className="mt-6 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Términos
        </h1>
        <p className="mt-4 text-[#6f675e]">
          Reservo Apps es un producto de BELLO BRUN FEDERICO YAIR, RUT 040291740013, Juan Lacaze, Colonia, Uruguay.
        </p>
        <p className="mt-4 text-[#6f675e]">
          El servicio es una agenda online para locales. La prueba dura 7 días. Después se paga el plan elegido, mes a mes, por Mercado Pago o transferencia. Si el mes no se paga, la agenda pública se pausa.
        </p>
        <p className="mt-4 text-[#6f675e]">
          El plan automático envía WhatsApp a través de Meta. Reservo no garantiza la entrega de cada mensaje. El costo de esos envíos lo define Meta.
        </p>
        <p className="mt-4 text-[#6f675e]">
          La seña, los productos y el servicio al cliente final los cobra y responde el local. Reservo no es parte de esa venta.
        </p>
        <p className="mt-4 text-[#6f675e]">
          Podés dar de baja el local escribiendo a WhatsApp +598 97 344 643. Los datos del mes en curso no se reintegran.
        </p>
      </div>
    </main>
  );
}
