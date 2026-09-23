"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Shop = {
  id: string;
  nombre: string;
  logo_url: string | null;
  direccion: string | null;
  maps_url: string | null;
  horario_texto: string | null;
  rubro: string | null;
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
function IcoBotella() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M10 3h4v3l2 3v12H8V9l2-3z" />
    </svg>
  );
}
function IcoUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c1-3.5 3.4-5 7-5s6 1.5 7 5" />
    </svg>
  );
}
function IcoReloj() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

export default function ShopHome() {
  const supabase = createClient();
  const [shop, setShop] = useState<Shop | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const slug = slugActual();
      if (!slug) return;
      localStorage.setItem("barberia_slug", slug);
      const { data } = await supabase
        .from("barberias")
        .select("id, nombre, logo_url, direccion, maps_url, horario_texto, rubro")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) return;
      setShop(data as Shop);
      const { data: portada } = await supabase.from("fotos").select("url").eq("barberia_id", data.id).eq("mostrar_inicio", true).limit(1);
      if (portada?.[0]?.url) {
        setFoto(portada[0].url);
        return;
      }
      const { data: cualquiera } = await supabase.from("fotos").select("url").eq("barberia_id", data.id).limit(1);
      setFoto(cualquiera?.[0]?.url || data.logo_url || null);
    };
    void load();
  }, [supabase]);

  const partes = (shop?.nombre || "").trim().split(" ");
  const principal = partes[0] || "";
  const resto = partes.slice(1).join(" ");
  const panelTxt = shop?.rubro === "pestanas_unas" || shop?.rubro === "canina" ? "Panel del equipo" : "Panel del barbero";

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-3">
      <header className="mb-4 grid grid-cols-[56px_1fr_40px] items-center gap-3">
        <Link href="/" className="h-14 w-14 overflow-hidden rounded-full" style={{ border: "1px solid var(--line)" }}>
          {shop?.logo_url ? (
            <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center" style={{ fontFamily: "Georgia, Times, serif" }}>
              {principal.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
        <Link href="/" className="min-w-0 text-left">
          <p className="truncate tracking-[0.08em]" style={{ fontFamily: "Georgia, Times, serif", fontSize: "26px", lineHeight: 1 }}>
            {principal}
          </p>
          <p className="mt-1 flex items-center gap-2 text-[10px] tracking-[0.28em]">
            <span className="h-px w-6" style={{ background: "currentColor", opacity: 0.35 }} />
            ✂
            <span className="h-px w-6" style={{ background: "currentColor", opacity: 0.35 }} />
          </p>
          {resto ? (
            <p className="truncate text-[10px] tracking-[0.26em]" style={{ color: "var(--muted)" }}>
              {resto.toUpperCase()}
            </p>
          ) : null}
        </Link>
        <button
          onClick={() => {
            const next = !document.documentElement.classList.contains("oscuro");
            document.documentElement.classList.toggle("oscuro", next);
            localStorage.setItem("tema", next ? "oscuro" : "claro");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ border: "1px solid var(--line)" }}
        >
          ☾
        </button>
      </header>

      {foto ? (
        <img src={foto} alt="" className="mb-5 h-52 w-full object-cover" style={{ borderRadius: 8 }} />
      ) : (
        <div className="mb-5 flex h-52 items-center justify-center text-sm" style={{ background: "var(--card)", border: "1px dashed var(--line)", borderRadius: 8, color: "var(--muted)" }}>
          Subí una foto en Galería y marcá “mostrar en inicio”
        </div>
      )}

      <h1 className="text-center text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
        Reservá tu turno
      </h1>
      {shop?.direccion && <p className="mt-2 text-center text-sm">⌖ {shop.direccion}</p>}
      {shop?.maps_url && (
        <p className="mt-1 text-center text-sm">
          <a href={shop.maps_url} target="_blank" rel="noreferrer" className="underline">
            Cómo llegar →
          </a>
        </p>
      )}

      <Link href="/reservar" className="mt-5 block py-3.5 text-center text-lg" style={{ background: "#1A1612", color: "#F6F1E8", borderRadius: 999, fontFamily: "Georgia, Times, serif" }}>
        Reservar
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/tienda" className="flex items-center justify-center gap-2 py-3 text-sm" style={{ border: "1px solid var(--line)", borderRadius: 8 }}>
          <IcoBotella /> Productos
        </Link>
        <Link href="/login" className="flex items-center justify-center gap-2 py-3 text-sm" style={{ border: "1px solid var(--line)", borderRadius: 8 }}>
          <IcoUser /> {panelTxt}
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-3 px-4 py-3" style={{ border: "1px solid var(--line)", borderRadius: 8 }}>
        <IcoReloj />
        <div>
          <p className="text-[10px] tracking-[0.16em]" style={{ color: "var(--muted)" }}>HORARIO</p>
          <p className="text-sm">{shop?.horario_texto || "Lun–Sáb 9:00 – 20:00"}</p>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-md items-center justify-around py-3 text-[11px]">
          <Link href="/" className="flex flex-col items-center gap-1"><IcoHome />Inicio</Link>
          <Link href="/reservar" className="flex flex-col items-center gap-1"><IcoCal />Reservar</Link>
          <Link href="/tienda" className="flex flex-col items-center gap-1"><IcoBag />Tienda</Link>
        </div>
      </nav>
    </main>
  );
}
