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
};

function slugActual() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.replace(/^www\./, "");
  if (host.endsWith(".reservoapps.com")) {
    const sub = host.replace(/\.reservoapps\.com$/, "");
    if (sub && sub !== "www") return sub;
  }
  const path = window.location.pathname;
  if (path.startsWith("/b/")) return path.split("/")[2] || "";
  return localStorage.getItem("barberia_slug") || "";
}

function ThemeBtn() {
  const [oscuro, setOscuro] = useState(false);
  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("oscuro"));
  }, []);
  return (
    <button
      onClick={() => {
        const next = !document.documentElement.classList.contains("oscuro");
        document.documentElement.classList.toggle("oscuro", next);
        localStorage.setItem("tema", next ? "oscuro" : "claro");
        setOscuro(next);
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
      style={{ border: "1px solid var(--line)" }}
      aria-label="Tema"
    >
      {oscuro ? "☀" : "☾"}
    </button>
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
        .select("id, nombre, logo_url, direccion, maps_url, horario_texto")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) return;
      setShop(data as Shop);
      const { data: f } = await supabase
        .from("fotos")
        .select("url")
        .eq("barberia_id", data.id)
        .eq("mostrar_inicio", true)
        .limit(1)
        .maybeSingle();
      setFoto(f?.url || null);
    };
    void load();
  }, [supabase]);

  const partes = (shop?.nombre || "").split(" ");
  const principal = partes[0] || "";
  const resto = partes.slice(1).join(" ");

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-3">
      <header className="mb-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {shop?.logo_url ? (
            <img src={shop.logo_url} alt="" className="h-14 w-14 rounded-full object-cover" style={{ border: "1px solid var(--line)" }} />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full text-lg" style={{ border: "1.5px solid currentColor", fontFamily: "Georgia, Times, serif" }}>
              {principal.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="text-left">
            <span className="block tracking-[0.12em]" style={{ fontFamily: "Georgia, Times, serif", fontSize: "28px", lineHeight: 1 }}>
              {principal}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-[10px] tracking-[0.28em]">
              <span className="h-px w-6" style={{ background: "currentColor", opacity: 0.4 }} />
              ✂
              <span className="h-px w-6" style={{ background: "currentColor", opacity: 0.4 }} />
            </span>
            {resto ? (
              <span className="block text-[10px] tracking-[0.28em]" style={{ color: "var(--muted)" }}>
                {resto.toUpperCase()}
              </span>
            ) : null}
          </span>
        </Link>
        <ThemeBtn />
      </header>

      {foto && (
        <img src={foto} alt="" className="mb-5 h-52 w-full rounded-md object-cover" />
      )}

      <h1 className="text-center text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
        Reservá tu turno
      </h1>
      {shop?.direccion && (
        <p className="mt-2 text-center text-sm">
          ⌖ {shop.direccion}
        </p>
      )}
      {shop?.maps_url && (
        <p className="mt-1 text-center text-sm">
          <a href={shop.maps_url} target="_blank" rel="noreferrer" className="underline">
            Cómo llegar →
          </a>
        </p>
      )}

      <Link href="/reservar" className="mt-5 block rounded-full py-3.5 text-center text-lg" style={{ background: "#1A1612", color: "#F6F1E8", fontFamily: "Georgia, Times, serif" }}>
        Reservar
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/tienda" className="flex items-center justify-center gap-2 rounded-md py-3 text-sm" style={{ border: "1px solid var(--line)" }}>
          <span>🧴</span> Productos
        </Link>
        <Link href="/login" className="flex items-center justify-center gap-2 rounded-md py-3 text-sm" style={{ border: "1px solid var(--line)" }}>
          <span>👤</span> Panel del barbero
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-md px-4 py-3" style={{ border: "1px solid var(--line)" }}>
        <span className="text-xl">◷</span>
        <div>
          <p className="text-[10px] tracking-[0.16em]" style={{ color: "var(--muted)" }}>HORARIO</p>
          <p className="text-sm">{shop?.horario_texto || "Lun–Sáb 9:00 – 20:00"}</p>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md items-center justify-around border-t bg-[var(--bg)] py-3 text-xs" style={{ borderColor: "var(--line)" }}>
        <Link href="/" className="text-center">⌂<br />Inicio</Link>
        <Link href="/reservar" className="text-center">▦<br />Reservar</Link>
        <Link href="/tienda" className="text-center">👜<br />Tienda</Link>
      </nav>
    </main>
  );
}
