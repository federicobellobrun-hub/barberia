"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

function slugDeHost() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.replace(/^www\./, "");
  if (host === "reservoapps.com" || host === "localhost") return null;
  if (!host.endsWith(".reservoapps.com")) return null;
  const sub = host.replace(/\.reservoapps\.com$/, "");
  if (!sub || sub === "www") return null;
  return sub;
}

function slugDeQuery() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("b");
}

function aplicarTema(oscuro: boolean) {
  const r = document.documentElement;
  r.classList.toggle("oscuro", oscuro);
  let tag = document.getElementById("reservo-tema") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "reservo-tema";
    document.head.appendChild(tag);
  }
  tag.textContent = oscuro
    ? `
    html.oscuro, html.oscuro body, html.oscuro #__next, html.oscuro main {
      background: #161310 !important;
      color: #F3EBDD !important;
    }
    html.oscuro header,
    html.oscuro article,
    html.oscuro section,
    html.oscuro nav,
    html.oscuro .rounded-xl,
    html.oscuro .rounded-2xl,
    html.oscuro .rounded-3xl {
      background-color: #2a241c !important;
      color: #F3EBDD !important;
      border-color: #5a5246 !important;
    }
    html.oscuro p, html.oscuro span, html.oscuro a, html.oscuro button,
    html.oscuro label, html.oscuro b, html.oscuro h1, html.oscuro h2 {
      color: #F3EBDD !important;
    }
  `
    : "";
  document.body.style.setProperty("background", oscuro ? "#161310" : "#F6F1E8", "important");
}

export default function BrandHeader({ left }: { left?: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [nombre, setNombre] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [home, setHome] = useState("/");
  const [rubro, setRubro] = useState("barberia");
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tema") === "oscuro";
    setOscuro(saved);
    aplicarTema(saved);
  }, []);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const slugPath = pathname.startsWith("/b/") ? pathname.split("/")[2] : null;
      const slugHost = slugDeHost();
      const slugQuery = slugDeQuery();
      const enPublico =
        Boolean(slugPath || slugHost || slugQuery) ||
        pathname.startsWith("/reservar") ||
        pathname.startsWith("/tienda");
      let slug =
        slugPath ||
        slugHost ||
        slugQuery ||
        (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null);
      if (enPublico && (slugPath || slugHost || slugQuery)) {
        slug = slugPath || slugHost || slugQuery;
        if (slug) localStorage.setItem("barberia_slug", slug);
      } else if (!enPublico) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
          if (u?.barberia_id) {
            const { data: b } = await supabase.from("barberias").select("nombre, logo_url, slug, rubro").eq("id", u.barberia_id).maybeSingle();
            if (b?.nombre) setNombre(b.nombre);
            setLogo(b?.logo_url || null);
            setRubro(b?.rubro || "barberia");
            setHome(b?.slug ? `/b/${b.slug}` : "/");
            return;
          }
        }
      }
      slug = slug || "diano";
      if (typeof window !== "undefined" && slug !== "reservoapps.com") {
        localStorage.setItem("barberia_slug", slug);
      }
      const { data: b } = await supabase.from("barberias").select("nombre, logo_url, slug, rubro").eq("slug", slug).maybeSingle();
      if (b?.nombre) setNombre(b.nombre);
      else setNombre(slug === "reservoapps.com" ? "Reservo" : slug);
      setLogo(b?.logo_url || null);
      setRubro(b?.rubro || "barberia");
      setHome(b?.slug ? `/b/${b.slug}` : `/b/${slug}`);
    };
    void load();
  }, [pathname]);

  const partes = (nombre || "Reservo").trim().split(" ");
  const principal = partes[0];
  const resto = partes.slice(1).join(" ");

  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="w-16">{left || <span />}</div>
      <Link href={home} className="text-center">
        {logo ? (
          <img src={logo} alt={nombre} className="mx-auto mb-2 h-16 w-16 rounded-full object-contain" />
        ) : (
          <span
            className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full text-lg"
            style={{ border: "1.5px solid currentColor", fontFamily: "Georgia, Times, serif" }}
          >
            {principal.slice(0, 2).toUpperCase()}
          </span>
        )}
        <p className="uppercase tracking-[0.28em]" style={{ fontFamily: "Georgia, Times, serif", fontSize: "44px", lineHeight: 1 }}>
          {principal}
        </p>
        <div className="my-1.5 flex items-center justify-center gap-2">
          <span className="h-px w-10" style={{ background: "currentColor", opacity: 0.35 }} />
          {rubro === "pestanas_unas" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M12 3c2 3 2 5 0 8 2 0 5 1 7 3-4 0-6 1-7 4-1-3-3-4-7-4 2-2 5-3 7-3-2-3-2-5 0-8z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="6" cy="7" r="3" />
              <circle cx="18" cy="7" r="3" />
              <path d="M8 9 12 14 16 9M12 14v7" />
            </svg>
          )}
          <span className="h-px w-10" style={{ background: "currentColor", opacity: 0.35 }} />
        </div>
        {resto ? (
          <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: "var(--muted)" }}>
            {resto}
          </p>
        ) : null}
      </Link>
      <div className="flex w-16 justify-end">
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs"
          style={{ border: "1px solid var(--line)" }}
          onClick={() => {
            const next = !oscuro;
            setOscuro(next);
            localStorage.setItem("tema", next ? "oscuro" : "claro");
            aplicarTema(next);
          }}
        >
          {oscuro ? "Claro" : "Oscuro"}
        </button>
      </div>
    </header>
  );
}
