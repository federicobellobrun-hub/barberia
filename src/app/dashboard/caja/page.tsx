"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Fila = {
  id: string;
  monto: number;
  metodo: string;
  pagado_at: string;
  turnos: {
    fecha_hora: string;
    clientes: { nombre: string } | { nombre: string }[] | null;
    servicios: { nombre: string } | { nombre: string }[] | null;
  } | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export default function CajaPage() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const inicio = new Date(`${mes}-01T00:00:00-03:00`);
      const fin = new Date(inicio);
      fin.setMonth(fin.getMonth() + 1);
      const { data, error } = await supabase
        .from("pagos")
        .select("id, monto, metodo, pagado_at, turnos(fecha_hora, clientes(nombre), servicios(nombre))")
        .gte("pagado_at", inicio.toISOString())
        .lt("pagado_at", fin.toISOString())
        .order("pagado_at");
      if (error) setError(error.message);
      setFilas((data as any) || []);
    };
    load();
  }, [mes, router]);

  const total = useMemo(() => filas.reduce((acc, f) => acc + Number(f.monto || 0), 0), [filas]);

  const exportar = () => {
    const lineas = [
      ["Fecha", "Cliente", "Servicio", "Método", "Monto"],
      ...filas.map((f) => [
        new Date(f.pagado_at).toLocaleString("es-UY"),
        one(f.turnos?.clientes)?.nombre || "",
        one(f.turnos?.servicios)?.nombre || "",
        f.metodo,
        String(f.monto),
      ]),
      ["", "", "", "TOTAL", String(total)],
    ];
    const csv = lineas.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `caja-${mes}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Caja</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-full rounded-2xl px-4 py-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
        <button onClick={exportar} className="w-full rounded-2xl py-3 mb-5 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
          Exportar Excel
        </button>
        <p className="text-2xl font-semibold mb-4">Total ${total}</p>
        {filas.map((f) => (
          <div key={f.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{one(f.turnos?.clientes)?.nombre || "Cliente"}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {one(f.turnos?.servicios)?.nombre} · {f.metodo} · ${f.monto}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
