"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase";
import { temaPack } from "@/lib/rubro";

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Shop = {
  id: string;
  direccion: string | null;
  maps_url: string | null;
  portada_url: string | null;
  rubro: string | null;
  estilo: string | null;
};
type Resena = { id: string; nombre: string | null; puntaje: number; comentario: string | null };

function Pin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block mr-1 -mt-0.5">
      <path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function Ornamento({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-2 my-3">
      <span className="h-px w-8" style={{ background: color, opacity: 0.45 }} />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2">
        <path d="M12 3c2 3 2 5 0 8 2 0 5 1 7 3-4 0-6 1-7 4-1-3-3-4-7-4 2-2 5-3 7-3-2-3-2-5 0-8z" />
      </svg>
      <span className="h-px w-8" style={{ background: color, opacity: 0.35 }} />
    </div>
  );
}

export default function BarberiaHomePage() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [fotos, setFotos] = useState<{ id: string; url: string }[]>([]);
  const [horarios, setHorarios] = useState<{ dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rubro, setRubro] = useState(() => {
    if (typeof window === "undefined") return "barberia";
    return localStorage.getItem("rubro_" + slug) || "barberia";
  });
  const [estilo, setEstilo] = useState(() => {
    if (typeof window === "undefined") return "auto";
    return localStorage.getItem("estilo_" + slug) || "auto";
  });

  const t = temaPack(estilo, rubro);
  const rosa = t.pack === "rosa";

  useEffect(() => {
    if (slug) localStorage.setItem("barberia_slug", slug);
    const load = async () => {
      const supabase = createClient();
      const { data: b, error: e } = await supabase
        .from("barberias")
        .select("id, direccion, maps_url, portada_url, rubro, estilo")
        .eq("slug", slug)
        .maybeSingle();
      if (e || !b) {
        setError("No se encontró la barbería");
        return;
      }
      const shopData = b as Shop;
      setShop(shopData);
      const r = shopData.rubro || "barberia";
      const pack = shopData.estilo || "auto";
      setRubro(r);
      setEstilo(pack);
      localStorage.setItem("rubro_" + slug, r);
      localStorage.setItem("estilo_" + slug, pack);
      const [f, h, n] = await Promise.all([
        supabase.from("fotos").select("id, url").eq("barberia_id", b.id).eq("mostrar_inicio", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin, activo").eq("barberia_id", b.id).order("dia_semana"),
        supabase.from("resenas").select("id, nombre, puntaje, comentario").eq("barberia_id", b.id).eq("visible", true).order("created_at", { ascending: false }).limit(6),
      ]);
      setFotos(f.data || []);
      setHorarios(h.data || []);
      setResenas((n.data as Resena[]) || []);
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

  const promedio = resenas.length ? resenas.reduce((a, r) => a + r.puntaje, 0) / resenas.length : 0;

  return (
    <main className="min-h-screen pb-28" style={{ background: t.bg, color: t.text }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <BrandHeader />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {shop?.portada_url && (
          <div className="mb-6 overflow-hidden" style={{ borderRadius: rosa ? 22 : 8 }}>
            <img src={shop.portada_url} alt="" className="w-full h-52 object-cover" />
          </div>
        )}
        <p className="text-center text-[11px] tracking-[0.22em] uppercase" style={{ color: t.muted }}>
          {rosa ? "Estudio" : "Barbería"}
        </p>
        {rosa && <Ornamento color={t.btn} />}
        <h1 className="text-center mb-2" style={{ fontFamily: "Georgia, Times, serif", fontSize: rosa ? "38px" : "42px", lineHeight: 1.1 }}>
          {t.cita}
        </h1>
        {shop?.direccion && (
          <p className="text-center text-[15px] mb-1">
            <Pin />
            {shop.direccion}
          </p>
        )}
        {shop?.maps_url && (
          <a href={shop.maps_url} target="_blank" rel="noreferrer" className="block text-center text-sm underline mb-6">
            Cómo llegar →
          </a>
        )}
        <Link href={`/reservar?b=${slug}`} className="block text-center py-3.5 text-[16px] mb-3" style={{ background: t.btn, color: t.btnText, borderRadius: rosa ? 999 : 8 }}>
          Reservar
        </Link>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Link href={`/tienda?b=${slug}`} className="py-3 text-center text-sm flex flex-col items-center justify-center gap-1" style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: rosa ? 999 : 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 8h16l-1 11H5L4 8zM9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            Productos
          </Link>
          <Link href="/login" className="py-3 text-center text-sm flex flex-col items-center justify-center gap-1" style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: rosa ? 999 : 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            {t.panel}
          </Link>
        </div>
        <Link href={`/resena?b=${slug}`} className="block text-center py-3 mb-6 text-sm" style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: rosa ? 999 : 8 }}>
          Dejá tu reseña
        </Link>
        {resumenHorario && (
          <div className="px-4 py-3.5 mb-8 flex items-center gap-3" style={{ background: t.card, borderRadius: rosa ? 22 : 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2" />
            </svg>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: t.muted }}>Horario</p>
              <p className="text-[15px]">{resumenHorario}</p>
            </div>
          </div>
        )}
        {resenas.length > 0 && (
          <section className="mb-8">
            <h2 className="text-center text-xs tracking-[0.16em] uppercase mb-2" style={{ color: t.muted }}>Reseñas</h2>
            <p className="text-center mb-4">{"★".repeat(Math.round(promedio))} · {promedio.toFixed(1)}</p>
            {resenas.map((r) => (
              <div key={r.id} className="p-4 mb-2" style={{ background: t.card, borderRadius: rosa ? 18 : 12 }}>
                <p className="text-sm font-medium">{r.nombre || "Cliente"} · {"★".repeat(r.puntaje)}</p>
                {r.comentario && <p className="text-sm mt-1" style={{ color: t.muted }}>{r.comentario}</p>}
              </div>
            ))}
          </section>
        )}
        {fotos.length > 0 && (
          <section>
            <h2 className="text-center text-xs tracking-[0.16em] uppercase mb-3" style={{ color: t.muted }}>{t.galeria}</h2>
            <div className="grid grid-cols-2 gap-2">
              {fotos.map((f) => (
                <img key={f.id} src={f.url} alt="" className="h-36 w-full object-cover" style={{ borderRadius: rosa ? 18 : 8 }} />
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
        bg={t.bg}
        line={t.line}
        text={t.text}
        muted={t.muted}
      />
    </main>
  );
}
