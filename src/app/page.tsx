"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const WA = "https://wa.me/59897344643?text=" + encodeURIComponent("Hola Federico, consulta por Reservo Apps");

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[22px]"
        style={{ border: "1.5px solid #1C1712", fontFamily: "Georgia, Times, serif" }}
      >
        R
      </span>
      <span className="text-[15px] tracking-[0.18em]" style={{ fontFamily: "Georgia, Times, serif" }}>
        RESERVO APPS
      </span>
    </Link>
  );
}

export default function HomePage() {
  const [manual, setManual] = useState(890);
  const [auto, setAuto] = useState(1490);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("reservo_ajustes").select("precio_manual, precio_automatico").eq("id", 1).maybeSingle();
      if (data?.precio_manual) setManual(Number(data.precio_manual));
      if (data?.precio_automatico) setAuto(Number(data.precio_automatico));
    };
    void load();
  }, []);

  return (
    <main className="min-h-screen relative" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="relative mx-auto max-w-md px-5 pt-6 pb-16">
        <header className="flex items-center justify-between mb-12">
          <Logo />
          <Link href="/login" className="text-[13px] text-[#7a7268]">
            Ingresar
          </Link>
        </header>

        <h1 className="text-[40px] leading-[1.05] mb-5" style={{ fontFamily: "Georgia, Times, serif" }}>
          Reservá, avisá,
          <br />
          cobrá.
        </h1>
        <p className="text-[17px] leading-6 text-[#7a7268] mb-2">Apps de reservas para negocios locales.</p>
        <p className="text-sm text-[#7a7268] mb-8">Agenda, clientes, recordatorios y avisos.</p>

        <Link href="/probar" className="mb-3 inline-flex rounded-full px-8 py-3.5 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
          Probar 7 días
        </Link>
        <p className="text-xs text-[#9a9388] mb-10">
          Manual ${manual.toLocaleString("es-UY")} · Automático ${auto.toLocaleString("es-UY")} ·{" "}
          <Link href="/precios" className="underline underline-offset-2">
            Ver planes
          </Link>
        </p>

        <Link href="/b/diano" className="relative mb-3 block h-[168px] overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80" alt="Diano Barbershop" className="h-full w-full object-cover" />
          <span className="absolute left-4 bottom-4 text-white text-lg" style={{ fontFamily: "Georgia, Times, serif", textShadow: "0 1px 8px rgba(0,0,0,.45)" }}>
            Ver demo Diano
          </span>
        </Link>

        <Link href="/b/vale-studio" className="relative mb-12 block h-[168px] overflow-hidden rounded-2xl">
          <img src="/pestanas.jpg" alt="Vale Studio" className="h-full w-full object-cover" />
          <span className="absolute left-4 bottom-4 text-[#1C1712] text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
            Ver demo Vale Studio
          </span>
        </Link>

        <footer className="text-center text-[11px] leading-5 text-[#9a9388]">
          <p>
            <Link href="/precios" className="underline underline-offset-2">Precios</Link>
            {" · "}
            <Link href="/legal/terminos" className="underline underline-offset-2">Términos</Link>
            {" · "}
            <Link href="/legal/privacidad" className="underline underline-offset-2">Privacidad</Link>
          </p>
          <p className="mt-4">
            Reservo Apps es un producto de BELLO BRUN FEDERICO YAIR
            <br />
            RUT 040291740013
            <br />
            Montevideo 710 101, Juan Lacaze, Colonia
          </p>
        </footer>
      </div>

      <a
        href={WA}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ right: 18, bottom: 22, background: "#1C1712", color: "#F5F0E8" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </main>
  );
}
