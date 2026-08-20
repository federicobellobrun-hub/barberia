"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default function CajaPage() {
  const [total, setTotal] = useState(0);
  const [efectivo, setEfectivo] = useState(0);
  const [transferencia, setTransferencia] = useState(0);
  const [cantidad, setCantidad] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const ymd = new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
      const { data } = await supabase
        .from("pagos")
        .select("monto, metodo")
        .gte("pagado_at", `${ymd}T00:00:00-03:00`)
        .lte("pagado_at", `${ymd}T23:59:59-03:00`);
      const rows = data || [];
      setCantidad(rows.length);
      setTotal(rows.reduce((a, p) => a + Number(p.monto), 0));
      setEfectivo(rows.filter((p) => p.metodo === "efectivo").reduce((a, p) => a + Number(p.monto), 0));
      setTransferencia(rows.filter((p) => p.metodo === "transferencia").reduce((a, p) => a + Number(p.monto), 0));
    };
    load();
  }, [router]);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Caja del día</h1>
        {[
          ["Total", `$${total}`],
          ["Efectivo", `$${efectivo}`],
          ["Transferencia", `$${transferencia}`],
          ["Pagos", cantidad],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{l}</p>
            <p className="text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
