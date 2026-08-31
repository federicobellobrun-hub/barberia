"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "@/lib/supabase";

export default function BrandHeader({ left }: { left?: React.ReactNode }) {
  const [nombre, setNombre] = useState("Diano");
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("barberias").select("nombre, logo_url").limit(1).maybeSingle();
      if (data?.nombre) setNombre(data.nombre);
      if (data?.logo_url) setLogo(data.logo_url);
    };
    load();
  }, []);

  const principal = nombre.split(" ")[0] || "Diano";
  const resto = nombre.split(" ").slice(1).join(" ") || "Barbershop";

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="w-16">{left || <span />}</div>
      <Link href="/" className="text-center">
        {logo ? (
          <img src={logo} alt={nombre} className="h-14 w-14 mx-auto object-contain rounded-full mb-2" />
        ) : null}
        <p className="font-brand text-xl tracking-[0.35em] uppercase">{principal}</p>
        <div className="flex items-center justify-center gap-2 my-1">
          <span className="h-px w-8" style={{ background: "var(--line)" }} />
          <span className="text-[10px]">✂</span>
          <span className="h-px w-8" style={{ background: "var(--line)" }} />
        </div>
        <p className="font-brand text-[11px] tracking-[0.28em] uppercase" style={{ color: "var(--muted)" }}>
          {resto}
        </p>
      </Link>
      <div className="w-16 flex justify-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
