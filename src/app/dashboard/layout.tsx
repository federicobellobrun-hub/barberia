"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { temaPack, aplicarTema } from "@/lib/rubro";
import BottomNav from "@/components/BottomNav";

const PERMITIDO = ["/dashboard", "/dashboard/nuevo", "/dashboard/mas"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/dashboard";
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }

      const { data: yo } = await supabase
        .from("usuarios")
        .select("rol, barbero_id, barberia_id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      if (yo?.rol === "barbero" && !PERMITIDO.includes(path)) {
        router.replace("/dashboard");
        return;
      }

      if (typeof window !== "undefined" && yo?.barbero_id) {
        localStorage.setItem("barbero_filtro", yo.barbero_id);
      }

      const shopSlug =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("shop") : null;

      let estilo: string | null = null;
      let rubro: string | null = null;

      if (shopSlug) {
        const { data: shop } = await supabase
          .from("barberias")
          .select("estilo, rubro, slug")
          .eq("slug", shopSlug)
          .maybeSingle();
        estilo = shop?.estilo || "auto";
        rubro = shop?.rubro || "barberia";
        if (shop?.slug) localStorage.setItem("barberia_slug", shop.slug);
                if (shop?.slug) {
          localStorage.setItem("barberia_slug", shop.slug);
          localStorage.setItem("admin_shop", shop.slug);
        }
      } else if (yo?.barberia_id) {
        const { data: shop } = await supabase
          .from("barberias")
          .select("estilo, rubro, slug")
          .eq("id", yo.barberia_id)
          .maybeSingle();
        estilo = shop?.estilo || "auto";
        rubro = shop?.rubro || "barberia";
        if (shop?.slug) localStorage.setItem("barberia_slug", shop.slug);
      }

      aplicarTema(temaPack(estilo, rubro));
      setOk(true);
    });
  }, [path, router]);

  const enMas =
    path.startsWith("/dashboard/mas") ||
    path.startsWith("/dashboard/config") ||
    path.startsWith("/dashboard/horarios") ||
    path.startsWith("/dashboard/bloqueos") ||
    path.startsWith("/dashboard/barberos") ||
    path.startsWith("/dashboard/galeria") ||
    path.startsWith("/dashboard/resenas") ||
    path.startsWith("/dashboard/caja") ||
    path.startsWith("/dashboard/fijos") ||
    path.startsWith("/dashboard/espera") ||
    path.startsWith("/dashboard/productos");

  if (!ok) return <main className="min-h-screen p-6">Cargando…</main>;
  return (
    <>
      {children}
      <BottomNav
        items={[
          { href: "/dashboard", label: "Agenda", active: path === "/dashboard" },
          { href: "/dashboard/clientes", label: "Clientes", active: path.startsWith("/dashboard/clientes") },
          { href: "/dashboard/catalogo", label: "Catálogo", active: path.startsWith("/dashboard/catalogo") },
          { href: "/dashboard/mas", label: "Más", active: enMas },
        ]}
      />
    </>
  );
}
