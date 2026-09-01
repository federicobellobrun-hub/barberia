"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { createClient } from "@/lib/supabase";

const items = [
  { label: "Nuevo turno", href: "/dashboard/nuevo", icon: "📅" },
  { label: "Barberos", href: "/dashboard/barberos", icon: "✂" },
  { label: "Horarios", href: "/dashboard/horarios", icon: "🕰" },
  { label: "Caja del día", href: "/dashboard/caja", icon: "💰" },
  { label: "Galería inicio", href: "/dashboard/galeria", icon: "🖼" },
  { label: "Configuración", href: "/dashboard/config", icon: "⚙" },
  { label: "Catálogo", href: "/dashboard/catalogo", icon: "🏷" },
  { label: "Clientes", href: "/dashboard/clientes", icon: "👤" },
  { label: "Bloqueos", href: "/dashboard/bloqueos", icon: "🔒" },
];

export default function MasPage() {
  const [superadmin, setSuperadmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("usuarios").select("rol").eq("auth_user_id", user.id).single();
      setSuperadmin(data?.rol === "superadmin");
    };
    load();
  }, []);

  const menu = [
    ...items,
    ...(superadmin ? [{ label: "Panel dueño", href: "/dashboard/admin", icon: "♔" }] : []),
  ];

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Más</h1>
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl p-4 mb-3"
            style={{ background: "var(--card)", border: "1px solid var(--line)" }}
          >
            <span
              className="h-11 w-11 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
            >
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
