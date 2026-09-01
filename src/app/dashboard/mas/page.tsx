"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { createClient } from "@/lib/supabase";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "#1c1712" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

const icons = {
  turno: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  ),
  barberos: (
    <Icon>
      <circle cx="6" cy="7" r="3" />
      <circle cx="18" cy="7" r="3" />
      <path d="M8 9l8 10M16 9L8 19" />
    </Icon>
  ),
  horarios: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  caja: (
    <Icon>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 11h18M12 7v12" />
    </Icon>
  ),
  galeria: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M3 16l5-4 4 3 3-2 6 3" />
    </Icon>
  ),
  config: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5" />
    </Icon>
  ),
  catalogo: (
    <Icon>
      <path d="M7 4h10l2 4H5l2-4z" />
      <path d="M6 8h12v12H6z" />
      <path d="M10 12h4" />
    </Icon>
  ),
  clientes: (
    <Icon>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.5-3 4-5 7-5s5.5 2 7 5" />
    </Icon>
  ),
  bloqueos: (
    <Icon>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  ),
  admin: (
    <Icon>
      <path d="M3 8l4 2 5-6 5 6 4-2v11H3V8z" />
    </Icon>
  ),
};

const items = [
  { label: "Nuevo turno", href: "/dashboard/nuevo", icon: icons.turno },
  { label: "Barberos", href: "/dashboard/barberos", icon: icons.barberos },
  { label: "Horarios", href: "/dashboard/horarios", icon: icons.horarios },
  { label: "Caja del día", href: "/dashboard/caja", icon: icons.caja },
  { label: "Galería inicio", href: "/dashboard/galeria", icon: icons.galeria },
  { label: "Configuración", href: "/dashboard/config", icon: icons.config },
  { label: "Catálogo", href: "/dashboard/catalogo", icon: icons.catalogo },
  { label: "Clientes", href: "/dashboard/clientes", icon: icons.clientes },
  { label: "Bloqueos", href: "/dashboard/bloqueos", icon: icons.bloqueos },
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
    ...(superadmin ? [{ label: "Panel dueño", href: "/dashboard/admin", icon: icons.admin }] : []),
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
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
