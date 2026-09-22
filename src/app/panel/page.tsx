"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function PanelPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ok, setOk] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const { data: me } = await supabase.from("usuarios").select("rol, nombre").eq("auth_user_id", session.user.id).maybeSingle();
      if (me?.rol !== "superadmin") {
        router.replace("/dashboard");
        return;
      }
      setNombre(me.nombre || "Federico");
      setOk(true);
    };
    void load();
  }, [router, supabase]);

  if (!ok) return <main className="p-6">Cargando panel...</main>;

  const card = { background: "var(--card, #EFE8DC)", border: "1px solid var(--line, #e4ddd0)" };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <p className="text-[11px] tracking-[0.16em]" style={{ fontFamily: "Georgia, Times, serif" }}>
        RESERVO APPS
      </p>
      <h1 className="mt-2 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
        Panel
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Hola {nombre}. Acá ves los locales, no la agenda de Diano.
      </p>

      <div className="space-y-3">
        <Link href="/panel/locales" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Locales y equipo</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ver si cada barbería agregó barberos
          </p>
        </Link>

        <Link href="/dashboard/admin" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Crear / editar locales</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Altas, planes y activar o desactivar
          </p>
        </Link>

        <Link href="/precios" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Precios públicos</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Lo que ve el cliente en la Home
          </p>
        </Link>

        <Link href="/dashboard" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Agenda de Diano</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Entrar a la demo como local
          </p>
        </Link>

        <Link href="/" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Home Reservo</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            reservoapps.com
          </p>
        </Link>
      </div>
    </main>
  );
}
