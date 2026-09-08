"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase";

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Shop = {
  id: string;
  direccion: string | null;
  maps_url: string | null;
  portada_url: string | null;
};

export default function BarberiaHomePage() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [fotos, setFotos] = useState<{ id: string; url: string }[]>([]);
  const [horarios, setHorarios] = useState<{ dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) localStorage.setItem("barberia_slug", slug);
    const load = async () => {
      const supabase = createClient();
      const { data: b, error: e } = await supabase
        .from("barberias")
        .select("id, direccion, maps_url, portada_url")
        .eq("slug", slug)
        .maybeSingle();
      if (e || !b) {
        setError("No se encontró la barbería");
        return;
      }
      setShop(b);
      const [f, h] = await Promise.all([
        supabase.from("fotos").select("id, url").eq("barberia_id", b.id).eq("mostrar_inicio", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin, activo").eq("barberia_id", b.id).order("dia_semana"),
      ]);
      setFotos(f.data || []);
      setHorarios(h.data || []);
    };
    void load();
  }, [slug]);

  const resumenHorario = useMemo(() => {
    const abiertos = horarios.filter((h) => h.activo);
    if (!abiertos.length) return null;
    const ini = String(abiertos[0].hora_inicio).slice(0, 5);
    const fin = String(abiertos[0].hora_fin).slice(0, 5);
    const nombres = abiertos.map((h) => dias[h.dia_semana]);
    return `${nombres[0]}–${nombres[nombres.length - 1]} ${ini} – ${fin}`;
  }, [horarios]);

  return (
    <main className="min-h-screen pb-28" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {shop?.portada_url && (
          <img src={shop.portada_url} alt="" className="w-full h-48 object-cover rounded-2xl mb-6" />
        )}

        <h1 className="text-[34px] leading-tight text-center mb-3" style={{ fontFamily: "Georgia, Times, serif" }}>
          Reservá tu turno
        </h1>

        {shop?.direccion && (
          <p className="text-center text-sm mb-1">
            <span className="mr-1">📍</span>
            {shop.direccion}
          </p>
        )}
        {shop?.maps_url && (
          <a href={shop.maps_url} target="_blank" rel="noreferrer" className="block text-center text-sm underline mb-6">
            Cómo llegar →
          </a>
        )}

        <Link
          href={`/reservar?b=${slug}`}
          className="block text-center rounded-full py-3.5 text-[15px] mb-3"
          style={{ background: "#1C1712", color: "#F5F0E8" }}
        >
          Reservar
        </Link>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Link
            href={`/tienda?b=${slug}`}
            className="rounded-full py-3 text-center text-sm"
            style={{ border: "1px solid #1C1712" }}
          >
            Productos
          </Link>
          <Link
            href="/login"
            className="rounded-full py-3 text-center text-sm"
            style={{ border: "1px solid #1C1712" }}
          >
            Panel del barbero
          </Link>
        </div>

        {resumenHorario && (
          <div className="rounded-2xl px-4 py-3 mb-8 flex items-center gap-3" style={{ border: "1px solid #ddd4c8" }}>
            <span className="text-lg">🕒</span>
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#7a7268]">Horario</p>
              <p className="text-sm">{resumenHorario}</p>
            </div>
          </div>
        )}

        {fotos.length > 0 && (
          <section>
            <h2 className="text-center text-xs tracking-[0.16em] uppercase mb-3 text-[#7a7268]">Cortes</h2>
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
          { href: `/reservar?b=${slug}`, label: "Reservar" },
          { href: `/tienda?b=${slug}`, label: "Tienda" },
        ]}
      />
    </main>
  );
}
