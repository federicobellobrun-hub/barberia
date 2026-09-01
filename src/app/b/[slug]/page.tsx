"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase";

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function BarberiaHomePage() {
  const { slug } = useParams<{ slug: string }>();
  const [fotos, setFotos] = useState<{ id: string; url: string }[]>([]);
  const [horarios, setHorarios] = useState<{ dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: b, error } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
      if (error || !b) {
        setError("No se encontró la barbería");
        return;
      }
      const [f, h] = await Promise.all([
        supabase.from("fotos").select("id, url").eq("barberia_id", b.id).eq("mostrar_inicio", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin, activo").eq("barberia_id", b.id).order("dia_semana"),
      ]);
      setFotos(f.data || []);
      setHorarios(h.data || []);
    };
    load();
  }, [slug]);

  return (
    <main className="min-h-screen pb-28" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <h1 className="text-[36px] font-semibold tracking-tight leading-9 text-center mb-3">Reservá tu turno</h1>
        <p className="text-center mb-8" style={{ color: "var(--muted)" }}>Agenda simple. Atención precisa.</p>
        <Link href={`/b/${slug}/reservar`} className="block text-center rounded-2xl py-4 text-base font-medium mb-3" style={{ background: "#1c1712", color: "#f4efe6" }}>Reservar</Link>
        <Link href={`/b/${slug}/tienda`} className="block text-center rounded-2xl py-4 text-base mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>Productos</Link>
        <Link href="/login" className="block text-center rounded-2xl py-4 text-base mb-10" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>Panel del barbero</Link>

        {horarios.length > 0 && (
          <section className="mb-8">
            <h2 className="font-brand text-center tracking-[0.15em] uppercase mb-3">Horarios</h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              {horarios.map((h) => (
                <div key={h.dia_semana} className="px-4 py-3.5 flex justify-between text-sm border-b" style={{ borderColor: "var(--line)" }}>
                  <span>{dias[h.dia_semana]}</span>
                  <span style={{ color: "var(--muted)" }}>
                    {h.activo ? `${String(h.hora_inicio).slice(0, 5)} – ${String(h.hora_fin).slice(0, 5)}` : "Cerrado"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {fotos.length > 0 && (
          <section>
            <h2 className="font-brand text-center tracking-[0.15em] uppercase mb-3">Cortes</h2>
            <div className="grid grid-cols-2 gap-2">
              {fotos.map((f) => (
                <img key={f.id} src={f.url} alt="Corte" className="h-36 w-full object-cover rounded-2xl" />
              ))}
            </div>
          </section>
        )}
      </div>
      <BottomNav
        items={[
          { href: `/b/${slug}`, label: "Inicio", active: true },
          { href: `/b/${slug}/reservar`, label: "Reservar" },
          { href: `/b/${slug}/tienda`, label: "Tienda" },
        ]}
      />
    </main>
  );
}
