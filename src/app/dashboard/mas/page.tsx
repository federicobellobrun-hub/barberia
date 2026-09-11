"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Item = { href: string; t: string; d: string };

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
      <path d={d} />
    </svg>
  );
}

export default function MasPage() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: yo } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", data.user.id).maybeSingle();

      let rubro = "barberia";
      if (yo?.barberia_id) {
        const { data: shop } = await supabase.from("barberias").select("rubro").eq("id", yo.barberia_id).maybeSingle();
        rubro = shop?.rubro || "barberia";
      }
      const equipo = rubro === "pestanas_unas" ? "Equipo" : "Barberos";

      const dueño: Item[] = [
        { href: "/dashboard", t: "Agenda", d: "M4 6h16M4 10h16M4 14h10" },
        { href: "/dashboard/nuevo", t: "Nuevo turno", d: "M12 5v14M5 12h14" },
        { href: "/dashboard/clientes", t: "Clientes", d: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 19c1.5-3 4-5 7-5s5.5 2 7 5" },
        { href: "/dashboard/catalogo", t: "Catálogo", d: "M7 4h10l2 4H5l2-4zM6 8h12v12H6z" },
        { href: "/dashboard/catalogo", t: "Productos", d: "M4 8h16l-1 11H5L4 8zM9 8V6a3 3 0 0 1 6 0v2" },
        { href: "/dashboard/bloqueos", t: "Bloqueos", d: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z" },
        { href: "/dashboard/galeria", t: "Galería", d: "M4 6h16v12H4zM8 16l3-4 2 3 2-2 3 3" },
        { href: "/dashboard/horarios", t: "Horarios", d: "M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" },
        { href: "/dashboard/caja", t: "Caja", d: "M4 8h16v10H4zM8 8V6h8v2" },
        { href: "/dashboard/config", t: "Configuración", d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h2M18 12h2M12 4v2M12 18v2" },
        { href: "/dashboard/barberos", t: equipo, d: "M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 19c1-3 3-5 5-5s4 2 5 5M13 19c.4-2 2-4 4-4s3.5 1.5 4 4" },
      ];

      if (yo?.rol === "barbero") {
        setItems([
          { href: "/dashboard", t: "Agenda", d: "M4 6h16M4 10h16M4 14h10" },
          { href: "/dashboard/nuevo", t: "Nuevo turno", d: "M12 5v14M5 12h14" },
        ]);
      } else if (yo?.rol === "superadmin") {
        setItems([...dueño, { href: "/panel", t: "Panel dueño", d: "M4 6h16v12H4zM8 10h8" }]);
      } else {
        setItems(dueño);
      }
    });
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-8">
        <Link href="/dashboard" className="text-sm text-[#7a7268]">
          ← Agenda
        </Link>
        <h1 className="mt-4 text-3xl mb-6" style={{ fontFamily: "Georgia, Times, serif" }}>
          Más
        </h1>
        {!items ? (
          <p className="text-sm text-[#7a7268]">Cargando…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((i) => (
              <Link
                key={i.t}
                href={i.href}
                className="rounded-2xl p-4 text-sm"
                style={{ background: "#EFE8DC", border: "1px solid #ddd4c8" }}
              >
                <Icon d={i.d} />
                {i.t}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
