"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "@/lib/supabase";

export default function BrandHeader({ left }: { left?: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [nombre, setNombre] = useState("Reservo");
  const [logo, setLogo] = useState<string | null>(null);
  const [home, setHome] = useState("/");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const slugFromPath = pathname.startsWith("/b/") ? pathname.split("/")[2] : null;
      const enPublico = Boolean(slugFromPath) || pathname.startsWith("/reservar") || pathname.startsWith("/tienda");

      let slug = slugFromPath || (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null);

      if (enPublico && slugFromPath) {
        slug = slugFromPath;
        localStorage.setItem("barberia_slug", slugFromPath);
      } else if (!enPublico) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: u } = await supabase
            .from("usuarios")
            .select("barberia_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          if (u?.barberia_id) {
            const { data: b } = await supabase
              .from("barberias")
              .select("nombre, logo_url, slug")
              .eq("id", u.barberia_id)
              .maybeSingle();
            if (b?.nombre) setNombre(b.nombre);
            setLogo(b?.logo_url || null);
            setHome(b?.slug ? `/b/${b.slug}` : "/");
            return;
          }
        }
      }

      slug = slug || "diano";
      if (typeof window !== "undefined") localStorage.setItem("barberia_slug", slug);

      const { data: b } = await supabase
        .from("barberias")
        .select("nombre, logo_url, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (b?.nombre) setNombre(b.nombre);
      setLogo(b?.logo_url || null);
      setHome(b?.slug ? `/b/${b.slug}` : "/");
    };
    void load();
  }, [pathname]);

  const principal = nombre.split(" ")[0] || "Reservo";
  const resto = nombre.split(" ").slice(1).join(" ");

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="w-16">{left || <span />}</div>
      <Link href={home} className="text-center">
        {logo ? <img src={logo} alt={nombre} className="h-14 w-14 mx-auto object-contain rounded-full mb-2" /> : null}
        <p className="font-brand text-xl tracking-[0.35em] uppercase">{principal}</p>
        {resto ? (
          <>
            <div className="flex items-center justify-center gap-2 my-1">
              <span className="h-px w-8" style={{ background: "var(--line)" }} />
              <span className="text-[10px]">Scissors</span>
              <span className="h-px w-8" style={{ background: "var(--line)" }} />
            </div>
            <p className="font-brand text-[11px] tracking-[0.28em] uppercase" style={{ color: "var(--muted)" }}>
              {resto}
            </p>
          </>
        ) : null}
      </Link>
      <div className="w-16 flex justify-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
