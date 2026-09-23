"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

function Ico({ path }: { path: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d={path} />
    </svg>
  );
}

export default function LocalHome() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("barberia");

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      localStorage.setItem("barberia_slug", slug);
      const { data } = await supabase.from("barberias").select("nombre, rubro").eq("slug", slug).maybeSingle();
      setNombre(data?.nombre || slug);
      setRubro(data?.rubro || "barberia");
    };
    void load();
  }, [slug, supabase]);

  const cards = [
    { href: "/reservar", t: rubro === "canina" ? "Reservar" : "Reservar", d: "Elegí día y hora", i: "M7 3v3M17 3v3M4 9h16M6 7h12v13H6z" },
    { href: "/tienda", t: "Productos", d: "Ver el catálogo", i: "M3 7h18l-2 12H5L3 7zM8 7V5a4 4 0 0 1 8 0v2" },
    { href: "/login", t: "Panel", d: "Dueño o equipo", i: "M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-10 pt-4">
      <BrandHeader />
      <p className="mb-5 text-center text-sm" style={{ color: "var(--muted)" }}>
        {nombre}
      </p>
      <div className="space-y-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="flex items-center gap-4 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <Ico path={c.i} />
            <div>
              <p className="font-medium">{c.t}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{c.d}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
