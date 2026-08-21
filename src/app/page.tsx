"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase";

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function HomePage() {
  const [fotos, setFotos] = useState<{ id: string; url: string }[]>([]);
  const [horarios, setHorarios] = useState<
    { dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [f, h] = await Promise.all([
        supabase
          .from("fotos")
          .select("id, url")
          .eq("mostrar_inicio", true)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("horario_semanal")
          .select("dia_semana, hora_inicio, hora_fin, activo")
          .order("dia_semana"),
      ]);
      setFotos(f.data || []);
      setHorarios(h.data || []);
    };
    load();
  }, []);

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-10">
          <span className="text-xl">☰</span>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>
              Barbershop
            </p>
          </div>
          <ThemeToggle />
        </header>

        <h1 className="text-[34px] font-semibold tracking-tight leading-9">Reservá tu turno</h1>
        <p className="mt-2 mb-8" style={{ color: "var(--muted)" }}>
          Agenda simple. Atención precisa.
        </p>

        <Link
          href="/reservar"
          className="block text-center rounded-2xl py-4 font-medium mb-3"
          style={{ background: "#1d1d1f", color: "#fff" }}
        >
          Reservar
        </Link>
        <Link
          href="/tienda"
          className="block text-center rounded-2xl py-4 mb-3"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          Productos
        </Link>
        <Link
          href="/login"
          className="block text-center rounded-2xl py-4 mb-8"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          Panel del barbero
        </Link>

        {horarios.length > 0 && (
          <section className="mb-8">
            <h2 className="font-medium mb-3">Horarios</h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              {horarios.map((h) => (
                <div
                  key={h.dia_semana}
                  className="px-4 py-3 flex justify-between text-sm border-b"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span>{dias[h.dia_semana]}</span>
                  <span style={{ color: "var(--muted)" }}>
                    {h.activo
                      ? `${String(h.hora_inicio).slice(0, 5)} – ${String(h.hora_fin).slice(0, 5)}`
                      : "Cerrado"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {fotos.length > 0 && (
          <section>
            <h2 className="font-medium mb-3">Cortes</h2>
            <div className="grid grid-cols-2 gap-2">
              {fotos.map((f) => (
                <img key={f.id} src={f.url} alt="Corte" className="h-36 w-full object-cover rounded-2xl" />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
