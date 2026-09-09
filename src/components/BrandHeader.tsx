"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "@/lib/supabase";

function slugDeHost() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (!host.endsWith("reservoapps.com")) return null;
  const sub = host.replace(".reservoapps.com", "");
  if (!sub || sub === "www") return null;
  return sub;
}

export default function BrandHeader({ left }: { left?: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [nombre, setNombre] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [home, setHome] = useState("/");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const slugPath = pathname.startsWith("/b/") ? pathname.split("/")[2] : null;
      const slugHost = slugDeHost();
      const enPublico = Boolean(slugPath || slugHost) || pathname.startsWith("/reservar") || pathname.startsWith("/tienda");

      let slug = slugPath || slugHost || (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null);

      if (enPublico && (slugPath || slugHost)) {
        slug = slugPath || slugHost;
        if (slug) localStorage.setItem("barberia_slug", slug);
      } else if (!enPublico) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
          if (u?.barberia_id) {
            const { data: b } = await supabase.from("barberias").select("nombre, logo_url, slug").eq("id", u.barberia_id).maybeSingle();
            if (b?.nombre) setNombre(b.nombre);
            setLogo(b?.logo_url || null);
            setHome(b?.slug ? `/b/${b.slug}` : "/");
            return;
          }
        }
      }

      slug = slug || "diano";
      if (typeof window !== "undefined") localStorage.setItem("barberia_slug", slug);
      const { data: b } = await supabase.from("barberias").select("nombre, logo_url, slug").eq("slug", slug).maybeSingle();
      if (b?.nombre) setNombre(b.nombre);
      setLogo(b?.logo_url || null);
      setHome(b?.slug ? `/b/${b.slug}` : "/");
    };
    void load();
  }, [pathname]);

  const partes = (nombre || "Reservo").trim().split(" ");
  const principal = partes[0];
  const resto = partes.slice(1).join(" ");

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="w-14">{left || <span />}</div>
      <Link href={home} className="text-center">
        {logo ? (
          <img src={logo} alt={nombre} className="h-16 w-16 mx-auto object-contain rounded-full mb-2" />
        ) : (
          <span
            className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full text-lg"
            style={{ border: "1.5px solid currentColor", fontFamily: "Georgia, Times, serif" }}
          >
            {principal.slice(0, 2).toUpperCase()}
          </span>
        )}
        <p className="tracking-[0.28em] uppercase" style={{ fontFamily: "Georgia, Times, serif", fontSize: "34px", lineHeight: 1 }}>
          {principal}
        </p>
        <div className="flex items-center justify-center gap-2 my-1.5">
          <span className="h-px w-10" style={{ background: "currentColor", opacity: 0.35 }} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="6" cy="7" r="3" />
            <circle cx="18" cy="7" r="3" />
            <path d="M8 9 12 14 16 9M12 14v7" />
          </svg>
          <span className="h-px w-10" style={{ background: "currentColor", opacity: 0.35 }} />
        </div>
        {resto ? (
          <p className="tracking-[0.32em] uppercase text-[11px]" style={{ color: "var(--muted)" }}>
            {resto}
          </p>
        ) : null}
      </Link>
      <div className="w-14 flex justify-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
