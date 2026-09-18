"use client";

import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-10 text-sm leading-6">
        <Link href="/" className="text-[#7a7268]">
          ← Reservo Apps
        </Link>
        <h1 className="mt-6 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Privacidad
        </h1>
        <p className="mt-4 text-[#6f675e]">
          Guardamos nombre, teléfono, reservas, pagos del local y datos de cuenta que el dueño carga para operar la agenda.
        </p>
        <p className="mt-4 text-[#6f675e]">
          Los datos viven en Supabase. Los avisos de WhatsApp salen por Meta. No vendemos listados de clientes.
        </p>
        <p className="mt-4 text-[#6f675e]">
          El dueño del local ve los clientes de su local. El administrador de Reservo puede entrar a un local si pide soporte.
        </p>
        <p className="mt-4 text-[#6f675e]">
          Para borrar un local y sus datos, escribinos a +598 97 344 643.
        </p>
      </div>
    </main>
  );
}
