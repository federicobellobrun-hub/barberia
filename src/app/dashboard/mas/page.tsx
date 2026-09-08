"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const todos = [
  { href: "/dashboard", t: "Agenda" },
  { href: "/dashboard/nuevo", t: "Nuevo turno" },
  { href: "/dashboard/clientes", t: "Clientes" },
  { href: "/dashboard/catalogo", t: "Catálogo" },
  { href: "/dashboard/productos", t: "Productos" },
  { href: "/dashboard/bloqueos", t: "Bloqueos" },
  { href: "/dashboard/galeria", t: "Galería" },
  { href: "/dashboard/horarios", t: "Horarios" },
  { href: "/dashboard/caja", t: "Caja" },
  { href: "/dashboard/config", t: "Configuración" },
  { href: "/dashboard/barberos", t: "Barberos" },
];

export default function MasPage() {
  const [rol, setRol] = useState<string>("");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: yo } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();
      setRol(yo?.rol || "");
    });
  }, []);

  const items =
    rol === "barbero"
      ? [
          { href: "/dashboard", t: "Agenda" },
          { href: "/dashboard/nuevo", t: "Nuevo turno" },
        ]
      : todos.concat(rol === "superadmin" ? [{ href: "/panel", t: "Panel dueño" }] : []);

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-8">
        <Link href="/dashboard" className="text-sm text-[#7a7268]">
          ← Agenda
        </Link>
        <h1 className="mt-4 text-3xl mb-6" style={{ fontFamily: "Georgia, Times, serif" }}>
          Más
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="rounded-2xl p-4 text-sm"
              style={{ background: "#EFE8DC", border: "1px solid #ddd4c8" }}
            >
              {i.t}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
