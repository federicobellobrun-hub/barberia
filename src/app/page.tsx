"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const HORAS = ["09:00", "09:30", "10:00", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

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

  const rubros = [
    ["Barbería", "Corte y barba"],
    ["Pestañas y uñas", "Lifting y esmaltado"],
    ["Peluquería", "Color y corte"],
    ["Estudios", "Consultas y clases"],
    ["Oficios", "Visitas a domicilio"],
    ["Canina", "Baño y corte"],
  ];

  return (
    <main className="min-h-screen" style={{ background: "#F4EFE4", color: "#1A1612" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ border: "1.5px solid #1A1612", fontFamily: "Georgia, Times, serif" }}>
            R
          </span>
          <span>
            <span className="block text-xs tracking-[0.22em]" style={{ fontFamily: "Georgia, Times, serif" }}>
              RESERVO APPS
            </span>
            <span className="block text-[9px] tracking-[0.14em]" style={{ color: "#8A8378" }}>
              APPS DE RESERVA PARA NEGOCIOS LOCALES
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#agenda">La agenda</a>
          <a href="#rubros">Rubros</a>
          <a href="#planes">Planes</a>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login">Ingresar</Link>
          <Link href="/probar" className="rounded-full px-4 py-2" style={{ background: "#1A1612", color: "#F4EFE4" }}>
            Probar 7 días
          </Link>
          <Link href="/panel" className="text-[11px]" style={{ opacity: 0.35 }}>
            Panel
          </Link>
        </div>
      </header>

      <section id="agenda" className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-2">
        <div>
          <p className="text-[11px] tracking-[0.18em]" style={{ color: "#8A8378" }}>
            RESERVAS ONLINE · URUGUAY
          </p>
          <h1 className="mt-4 text-5xl leading-[1.05]" style={{ fontFamily: "Georgia, Times, serif" }}>
            Apps de reservas
            <br />
            para negocios
            <br />
            locales.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: "#5c564c" }}>
            Tus clientes eligen el horario desde el celular y el turno queda agendado al instante. Vos ves todo ordenado: agenda, clientes, recordatorios y avisos.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/probar" className="rounded-full px-5 py-3 text-sm" style={{ background: "#1A1612", color: "#F4EFE4" }}>
              Probar 7 días
            </Link>
            <a href="#rubros" className="rounded-full px-5 py-3 text-sm" style={{ border: "1px solid #d4cdc0" }}>
              Ver la agenda
            </a>
          </div>
          <p className="mt-3 text-xs" style={{ color: "#8A8378" }}>
            Sin tarjeta. Te dejamos la agenda lista el mismo día.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-5" style={{ border: "1px solid #ece6d8" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">Diano Barbería</p>
              <p className="text-xs" style={{ color: "#8A8378" }}>Miércoles 12 · Ciudad Vieja</p>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#F4EFE4" }}>
              Corte + barba
            </span>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {HORAS.map((h) => (
              <span
                key={h}
                className="rounded-xl py-2 text-center text-[11px]"
                style={{ background: h === "11:30" ? "#1A1612" : "#F7F3EA", color: h === "11:30" ? "#F4EFE4" : "#1A1612" }}
              >
                {h}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl px-3 py-3" style={{ background: "#F7F3EA" }}>
            <p className="text-xs">
              Mateo · 11:30 · Corte + barba
              <br />
              Recordatorio enviado 1 hora antes por WhatsApp
            </p>
            <span className="rounded-full px-3 py-1 text-[10px]" style={{ background: "#1A1612", color: "#F4EFE4" }}>
              CONFIRMADO
            </span>
          </div>
        </div>
      </section>

      <section id="rubros" className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-4xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Pensada para el local
          <br />
          del barrio.
        </h2>
        <p className="mt-3 max-w-lg text-sm" style={{ color: "#5c564c" }}>
          Elegí tu rubro y arrancás con servicios, duraciones y horarios ya armados.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          {rubros.map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-white px-3 py-4" style={{ border: "1px solid #ece6d8" }}>
              <p className="text-sm font-medium">{t}</p>
              <p className="text-xs" style={{ color: "#8A8378" }}>{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link href="https://diano.reservoapps.com" className="group relative block overflow-hidden rounded-3xl">
            <img src="/IMG_9774.jpeg" alt="Barbería" className="h-64 w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>Agenda para barberías y oficios.</p>
              <p className="mt-1 text-sm">Turnos, recordatorios y clientes.</p>
              <p className="mt-2 text-xs tracking-wide">VER DEMO →</p>
            </div>
          </Link>
          <Link href="https://vale-studio.reservoapps.com" className="group relative block overflow-hidden rounded-3xl">
            <img src="/IMG_9775.jpeg" alt="Estética" className="h-64 w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>Agenda para estudios y profesionales.</p>
              <p className="mt-1 text-sm">Organizá tu semana sin mensajes.</p>
              <p className="mt-2 text-xs tracking-wide">VER DEMO →</p>
            </div>
          </Link>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-4xl" style={{ fontFamily: "Georgia, Times, serif" }}>Dos planes, sin letra chica.</h2>
        <p className="mt-2 text-sm" style={{ color: "#5c564c" }}>Precio mensual en pesos. Cancelás cuando quieras.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8" style={{ border: "1px solid #ece6d8" }}>
            <p className="text-[11px] tracking-[0.16em]">PLAN MANUAL</p>
            <p className="mt-3 text-5xl">${manual.toLocaleString("es-UY")} <span className="text-base">/mes</span></p>
            <p className="mt-3 text-sm" style={{ color: "#5c564c" }}>Para empezar a tu ritmo: vos confirmás cada turno.</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>Agenda online con tus horarios</li>
              <li>Confirmación manual de cada reserva</li>
              <li>Link para tu Instagram</li>
              <li>Ficha de clientes</li>
            </ul>
            <Link href="/probar" className="mt-8 block rounded-full py-3 text-center text-sm" style={{ border: "1px solid #d4cdc0" }}>
              Probar 7 días
            </Link>
          </div>
          <div className="rounded-3xl p-8" style={{ background: "#1A1612", color: "#F4EFE4" }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] tracking-[0.16em]">PLAN AUTOMÁTICO</p>
              <span className="rounded-full px-3 py-1 text-[10px]" style={{ border: "1px solid #F4EFE4" }}>RECOMENDADO</span>
            </div>
            <p className="mt-3 text-5xl">${auto.toLocaleString("es-UY")} <span className="text-base">/mes</span></p>
            <p className="mt-3 text-sm opacity-80">La agenda se llena sola y avisa por vos.</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>Todo lo del plan Manual</li>
              <li>Reservas y confirmaciones automáticas 24/7</li>
              <li>Recordatorios y avisos por WhatsApp</li>
              <li>Lista de espera y control de ausencias</li>
              <li>Servicios ilimitados</li>
            </ul>
            <Link href="/probar" className="mt-8 block rounded-full py-3 text-center text-sm" style={{ background: "#F4EFE4", color: "#1A1612" }}>
              Probar 7 días
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-3xl px-8 py-14 text-center" style={{ background: "#1A1612", color: "#F4EFE4" }}>
          <h2 className="text-4xl" style={{ fontFamily: "Georgia, Times, serif" }}>Probá 7 días en tu local.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-80">Te armamos la agenda con tus servicios y horarios. Si no te sirve, la cancelás.</p>
          <Link href="/probar" className="mt-6 inline-block rounded-full px-6 py-3 text-sm" style={{ background: "#F4EFE4", color: "#1A1612" }}>
            Probar 7 días
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-10 md:flex-row md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs" style={{ border: "1.5px solid #1A1612" }}>R</span>
            <span className="text-xs tracking-[0.18em]">RESERVO APPS</span>
          </div>
          <p className="mt-3 max-w-xs text-xs" style={{ color: "#8A8378" }}>Agendas online para negocios locales de todo el Uruguay.</p>
          <p className="mt-3 text-xs" style={{ color: "#8A8378" }}>© 2026 Reservo Apps · Montevideo, Uruguay</p>
          <p className="mt-1 text-xs" style={{ color: "#8A8378" }}>Federico Yair Bello Brun · RUT 040291740013</p>
          <div className="mt-2 flex gap-3 text-xs">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
          </div>
        </div>
        <div className="text-sm md:text-right">
          <p>¿Hablamos?</p>
          <a href="https://wa.me/59897344643" className="underline">Escribinos por WhatsApp</a>
        </div>
      </footer>
    </main>
  );
}
