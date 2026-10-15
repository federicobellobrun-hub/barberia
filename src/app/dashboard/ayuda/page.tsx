"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

const PASOS = [
  { t: "1. Tu link", d: "En la agenda, arriba, está el link para clientes. Copialo y pasalo por WhatsApp o Instagram." },
  { t: "2. Horarios", d: "En Más → Horarios elegí los días y las horas que atendés. Si un día no abrís, desactivalo." },
  { t: "3. Servicios", d: "En Más → Servicios cargá nombre, precio, duración y, si querés, foto y categoría." },
  { t: "4. Equipo", d: "Si trabajás solo, no hace falta. Si hay más de uno, cargalos en la opción del equipo y cada uno ve sus turnos." },
  { t: "5. Bloqueos", d: "Feriados o un corte de horario se cargan en Más → Bloqueos. Esos horarios no aparecen para reservar." },
  { t: "6. Confirmar", d: "En manual, la reserva queda pendiente y la confirmás vos. En automático se confirma sola y llega el WhatsApp." },
  { t: "7. Mover o cancelar", d: "Abrí el turno en la agenda. Podés confirmar, marcar hecho, cancelar, no vino o moverlo de día y hora." },
  { t: "8. Plan", d: "En Configuración ves cuántos días te quedan. Podés pagar con Mercado Pago o transferir y avisarnos." },
];

export default function AyudaPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      <Link href="/dashboard/mas" className="mb-3 inline-block text-sm underline" style={{ color: "var(--muted)" }}>← Más</Link>
      <h1 className="mb-1 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Cómo usar</h1>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>Lo básico para empezar a recibir reservas.</p>
      <div className="space-y-3">
        {PASOS.map((p) => (
          <article key={p.t} className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{p.t}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{p.d}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm" style={{ color: "var(--muted)" }}>
        ¿Dudas? Escribinos por WhatsApp desde Configuración.
      </p>
    </main>
  );
}
