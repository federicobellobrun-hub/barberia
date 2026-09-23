"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import { temaPack, aplicarTema } from "@/lib/rubro";

type Shop = {
  id: string;
  nombre: string;
  portada_url: string | null;
  direccion: string | null;
  maps_url: string | null;
  horario_texto: string | null;
  rubro: string | null;
  estilo: string | null;
};

function slugActual() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.replace(/^www\./, "");
  if (host.endsWith(".reservoapps.com")) {
    const sub = host.replace(/\.reservoapps\.com$/, "");
    if (sub && sub !== "www") return sub;
  }
  if (window.location.pathname.startsWith("/b/")) return window.location.pathname.split("/")[2] || "";
  return localStorage.getItem("barberia_slug") || "";
}

function IcoHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 11 12 4l8 7v9H4z" />
    </svg>
  );
}
function IcoCal() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  );
}
function IcoBag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 8h14l-1.2 12H6.2L5 8zM9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function IcoUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c1-3.5 3.4-5 7-5s6 1.5 7 5" />
    </svg>
  );
}

function aplicarOscuro() {
  const r = document.documentElement;
  r.classList.add("oscuro");
  r.setAttribute("data-tema", "oscuro");
  r.style.setProperty("--bg", "#161310");
  r.style.setProperty("--card", "#231f1a");
  r.style.setProperty("--text", "#F6F1E8");
  r.style.setProperty("--muted", "#b8b0a4");
  r.style.setProperty("--line", "#3a342c");
  document.body.style.background = "#161310";
  document.body.style.color = "#F6F1E8";
}

export default function ShopHome() {
  const supabase = createClient();
  const [shop, setShop] = useState<Shop | null>(null);
  const [trabajos, setTrabajos] = useState<string[]>([]);
  const [pack, setPack] = useState(temaPack("auto", "barberia"));

  useEffect(() => {
    const load = async () => {
      const slug = slugActual();
      if (!slug) return;
      localStorage.setItem("barberia_slug", slug);
      const { data } = await supabase
        .from("barberias")
        .select("id, nombre, portada_url, direccion, maps_url, horario_texto, rubro, estilo")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) return;
      setShop(data as Shop);
      const t = temaPack(data.estilo, data.rubro);
      setPack(t);
      if (localStorage.getItem("tema") === "oscuro") aplicarOscuro();
      else {
        aplicarTema(t);
        document.body.style.background = t.bg;
        document.body.style.color = t.text;
      }
      const { data: fotos } = await supabase.from("fotos").select("url").eq("barberia_id", data.id);
      setTrabajos((fotos || []).map((f) => f.url).filter(Boolean));
    };
    void load();
  }, [supabase]);

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="mx-auto max-w-md px-4 pb-24 pt-2">
        <BrandHeader />

        {shop?.portada_url ? (
          <img src={shop.portada_url} alt="" className="mb-5 h-52 w-full object-cover" style={{ borderRadius: 8 }} />
        ) : (
          <div className="mb-5 flex h-36 items-center justify-center text-sm" style={{ background: "var(--card)", border: "1px dashed var(--line)", borderRadius: 8, color: "var(--muted)" }}>
            Cargá la foto de portada en Configuración
          </div>
        )}

        <h1 className="text-center text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          {pack.cita}
        </h1>
        {shop?.direccion && <p className="mt-2 text-center text-sm">⌖ {shop.direccion}</p>}
        {shop?.maps_url && (
          <p className="mt-1 text-center text-sm">
            <a href={shop.maps_url} target="_blank" rel="noreferrer" className="underline">Cómo llegar →</a>
          </p>
        )}

        <Link href="/reservar" className="mt-5 flex items-center justify-center gap-2 py-3.5 text-lg" style={{ background: "var(--text)", color: "var(--bg)", borderRadius: 999, fontFamily: "Georgia, Times, serif" }}>
          <IcoCal /> Reservar
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/tienda" className="flex items-center justify-center gap-2 py-3 text-sm" style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--card)" }}>
            <IcoBag /> Productos
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-2 py-3 text-sm" style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--card)" }}>
            <IcoUser /> {pack.panel}
          </Link>
        </div>

        <div className="mt-3 px-4 py-3" style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--card)" }}>
          <p className="text-[10px] tracking-[0.16em]" style={{ color: "var(--muted)" }}>HORARIO</p>
          <p className="text-sm">{shop?.horario_texto || "Lun–Sáb 9:00 – 20:00"}</p>
        </div>

        {trabajos.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>{pack.galeria}</h2>
            <div className="grid grid-cols-2 gap-2">
              {trabajos.map((url) => (
                <img key={url} src={url} alt="" className="h-36 w-full object-cover" style={{ borderRadius: 8 }} />
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-md items-center justify-around py-3 text-[11px]">
          <Link href="/" className="flex flex-col items-center gap-1"><IcoHome />Inicio</Link>
          <Link href="/reservar" className="flex flex-col items-center gap-1"><IcoCal />Reservar</Link>
          <Link href="/tienda" className="flex flex-col items-center gap-1"><IcoBag />Tienda</Link>
        </div>
      </nav>
    </div>
  );
}
