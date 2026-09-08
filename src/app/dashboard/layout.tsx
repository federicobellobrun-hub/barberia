"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const PERMITIDO = ["/dashboard", "/dashboard/nuevo"];

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
        .select("rol, barbero_id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();
      if (yo?.rol === "barbero" && !PERMITIDO.includes(path)) {
        router.replace("/dashboard");
        return;
      }
      if (typeof window !== "undefined" && yo?.barbero_id) {
        localStorage.setItem("barbero_filtro", yo.barbero_id);
      }
      setOk(true);
    });
  }, [path, router]);

  if (!ok) return <main className="min-h-screen p-6">Cargando…</main>;
  return <>{children}</>;
}
