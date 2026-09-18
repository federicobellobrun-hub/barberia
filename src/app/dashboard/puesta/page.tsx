"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

function shopActual() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("shop");
  if (q) {
    localStorage.setItem("admin_shop", q);
    return q;
  }
  return localStorage.getItem("admin_shop");
}

export default function PuestaPage() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasos, setPasos] = useState<{ t: string; href: string; listo: boolean }[]>([]);
  const router = useRouter();
  const shopQ = shopActual() ? `?shop=${shopActual()}` : "";

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const slugShop = shopActual();
      const { data: u } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", user.id).maybeSingle();
      let barberiaId = u?.barberia_id as string | null;
      if (u?.rol === "superadmin" && slugShop) {
        const { data: shop } = await supabase.from("barberias").select("id").eq("slug", slugShop).maybeSingle();
        if (shop) barberiaId = shop.id;
      }
      if (!barberiaId) return setError("Este usuario no tiene local");
      const [{ data: b }, { count: nServ }, { count: nHor }] = await Promise.all([
        supabase.from("barberias").select("logo_url, whatsapp_pedidos, direccion").eq("id", barberiaId).maybeSingle(),
        supabase.from("servicios").select("id", { count: "exact", head: true }).eq("barberia_id", barberiaId).eq("activo", true),
        supabase.from("horario_semanal").select("id", { count: "exact", head: true }).eq("barberia_id", barberiaId).eq("activo", true),
      ]);
      setPasos([
        { t: "Logo y WhatsApp", href: `/dashboard/config${shopQ}`, listo: Boolean(b?.logo_url && b?.whatsapp_pedidos) },
        { t: "Dirección", href: `/dashboard/config${shopQ}`, listo: Boolean(b?.direccion) },
        { t: "Horario de la semana", href: `/dashboard/horarios${shopQ}`, listo: Number(nHor || 0) > 0 },
        { t: "Al menos 3 servicios", href: `/dashboard/catalogo${shopQ}`, listo: Number(nServ || 0) >= 3 },
      ]);
      setOk(true);
    };
    void load();
  }, [router, shopQ]);

  const listos = pasos.filter((p) => p.listo).length;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href={`/dashboard/mas${shopQ}`}>‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Puesta a punto</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          {ok ? `${listos} de ${pasos.length} listos` : "Cargando..."}
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {pasos.map((p) => (
          <Link key={p.t} href={p.href} className="flex items-center justify-between rounded-2xl px-4 py-4 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <span>{p.t}</span>
            <span className="text-sm" style={{ color: p.listo ? "#3F6B3A" : "var(--muted)" }}>
              {p.listo ? "Listo" : "Falta →"}
            </span>
          </Link>
        ))}
        {ok && listos === pasos.length && (
          <p className="text-sm mt-6" style={{ color: "var(--muted)" }}>
            El local ya puede recibir reservas. Pedile a un cliente de confianza que reserve y fijate el recordatorio.
          </p>
        )}
      </div>
    </main>
  );
}
