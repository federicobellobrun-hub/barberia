"use client";

import Link from "next/link";

export default function PlanBanner({
  plan,
  planHasta,
  trialHasta,
  shopQ,
}: {
  plan?: string | null;
  planHasta?: string | null;
  trialHasta?: string | null;
  shopQ: string;
}) {
  const hasta = plan === "trial" ? trialHasta : planHasta;
  if (!hasta) return null;
  const fecha = new Date(`${String(hasta).slice(0, 10)}T23:59:59-03:00`);
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000);
  if (dias > 5) return null;
  const vencido = dias < 0;
  return (
    <Link
      href={`/dashboard/config${shopQ}`}
      className="block rounded-2xl px-4 py-3 mb-4 text-sm"
      style={{ background: vencido ? "#F3E4E0" : "#EFE8DC", border: "1px solid #ddd4c8" }}
    >
      {vencido
        ? "El plan venció. La agenda pública está pausada. Renová desde Configuración."
        : `El plan vence en ${dias} día${dias === 1 ? "" : "s"}. Renová desde Configuración.`}
    </Link>
  );
}
