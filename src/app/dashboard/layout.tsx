"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { temaPack, aplicarTema } from "@/lib/rubro";

const PERMITIDO = ["/dashboard", "/dashboard/nuevo", "/dashboard/mas"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
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

      if (yo?.rol === "barbero" && !PERMITIDO.includes(path || "")) {
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

  if (!ok) return <main className="min-h-screen p-6">Cargando…</main>;
  return <>{children}</>;
}
