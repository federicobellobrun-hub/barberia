"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const WA = "https://wa.me/59897344643?text=" + encodeURIComponent("Hola Federico, consulta por Reservo Apps");

const HORAS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const ACTIVA = "11:30";

const rubros = [
  { t: "Barbería", d: "Corte y barba" },
  { t: "Pestañas y uñas", d: "Lifting y esmaltado" },
  { t: "Peluquería", d: "Color y corte" },
  { t: "Estudios", d: "Consultas y clases" },
  { t: "Oficios", d: "Visitas a domicilio" },
  { t: "Canina", d: "Baño y corte" },
];

export default function HomePage() {
  const [manual, setManual] = useState(890);
  const [auto, setAuto] = useState(1490);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("reservo_ajustes").select("precio_manual, precio_automatico").eq("id", 1).maybeSingle();
        if (data?.precio_manual) setManual(Number(data.precio_manual));
        if (data?.precio_automatico) setAuto(Number(data.precio_automatico));
      } catch {
        /* fallback */
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(#F4EFE4, #F7F3EC)", color: "#1A1612" }}>
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(244,239,228,.88)", borderBottom: "1px solid rgba(26,22,18,.06)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ background: "#1A1612", color: "#F6F1E8", fontFamily: "Georgia, Times, serif" }}>
              R
            </span>
            <span className="text-[11px] tracking-[0.16em]" style={{ fontFamily: "Georgia, Times, serif" }}>
              RESERVO APPS
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#6f6a62] md:flex">
            <a href="#agenda">La agenda</a>
            <a href="#rubros">Rubros</a>
            <a href="#planes">Planes</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="hidden sm:inline">
              Ingresar
            </Link>
            <Link href="/probar" className="rounded-full px-4 py-2" style={{ background: "#1A1612", color: "#F6F1E8" }}>
              Probar 7 días
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-10 pb-20 md:pt-16">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] tracking-[0.18em] text-[#8A8378]">RESERVAS ONLINE · URUGUAY</p>
            <h1 className="text-[36px] leading-[1.08] md:text-[44px]" style={{ fontFamily: "Georgia, Times, serif" }}>
              Apps de reservas
              <br />
              para negocios
              <br />
              locales.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-6 text-[#6f6a62]">
              Tus clientes eligen el horario desde el celular y el turno queda agendado al instante. Vos ves todo ordenado: agenda, clientes, recordatorios y avisos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/probar" className="rounded-full px-6 py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
                Probar 7 días
              </Link>
              <a href="#agenda" className="rounded-full px-6 py-3 text-sm" style={{ border: "1px solid #1A1612" }}>
                Ver la agenda
              </a>
            </div>
            <p className="mt-3 text-[12px] text-[#8A8378]">Sin tarjeta. Te dejamos la agenda lista el mismo día.</p>
          </div>

          <div id="agenda" className="rounded-[28px] bg-white/80 p-5 shadow-sm" style={{ border: "1px solid rgba(26,22,18,.08)" }}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[17px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Diano Barbería
                </p>
                <p className="text-[12px] text-[#8A8378]">Miércoles · Ciudad Vieja</p>
              </div>
              <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#EFE8DC" }}>
                Corte + barba
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HORAS.map((h) => (
                <span
                  key={h}
                  className="rounded-full py-2 text-center text-[12px]"
                  style={{
                    background: h === ACTIVA ? "#1A1612" : "#F3EEE4",
                    color: h === ACTIVA ? "#F6F1E8" : "#1A1612",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F6F1E8" }}>
              <div>
                <p className="text-sm">Mateo · 11:30 · Corte + barba</p>
                <p className="text-[11px] text-[#8A8378]">Recordatorio enviado 1 hora antes por WhatsApp</p>
              </div>
              <span className="rounded-full px-3 py-1 text-[10px] tracking-[0.08em]" style={{ background: "#1A1612", color: "#F6F1E8" }}>
                CONFIRMADO
              </span>
            </div>
          </div>
        </section>

        <section id="rubros" className="mt-20">
          <h2 className="text-[32px] leading-9" style={{ fontFamily: "Georgia, Times, serif" }}>
            Pensada para el local
            <br />
            del barrio.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[#6f6a62]">Elegí tu rubro y arrancás con servicios, duraciones y horarios ya armados.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
            {rubros.map((r) => (
              <article key={r.t} className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.55)", border: "1px solid rgba(26,22,18,.06)" }}>
                <p className="text-sm">{r.t}</p>
                <p className="text-[12px] text-[#8A8378]">{r.d}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link href="/b/diano" className="group relative block h-56 overflow-hidden rounded-[24px]">
              <img src="/IMG_9774.jpeg" alt="Demo barbería" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-[20px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Agenda para barberías y oficios.
                </p>
                <p className="text-[13px] text-white/85">Turnos, recordatorios y clientes.</p>
                <p className="mt-2 text-[11px] tracking-[0.12em]">VER DEMO →</p>
              </div>
            </Link>
            <Link href="/b/vale-studio" className="group relative block h-56 overflow-hidden rounded-[24px]">
              <img src="/IMG_9775.jpeg" alt="Demo estudio" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4" style={{ color: "#1A1612" }}>
                <p className="text-[20px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Agenda para estudios y profesionales.
                </p>
                <p className="text-[13px] text-[#5c574e]">Organizá tu semana sin mensajes.</p>
                <p className="mt-2 text-[11px] tracking-[0.12em]">VER DEMO →</p>
              </div>
            </Link>
          </div>
        </section>

        <section id="planes" className="mt-20">
          <h2 className="text-[32px] leading-9" style={{ fontFamily: "Georgia, Times, serif" }}>
            Dos planes, sin letra chica.
          </h2>
          <p className="mt-3 text-sm text-[#6f6a62]">Precio mensual en pesos. Cancelás cuando quieras.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-[28px] bg-white/70 p-6" style={{ border: "1px solid rgba(26,22,18,.08)" }}>
              <p className="text-[11px] tracking-[0.14em] text-[#8A8378]">PLAN MANUAL</p>
              <p className="mt-3 text-[36px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                ${manual.toLocaleString("es-UY")} <span className="text-base">/mes</span>
              </p>
              <p className="mt-2 text-sm text-[#6f6a62]">Para empezar a tu ritmo: vos confirmás cada turno.</p>
              <ul className="mt-5 space-y-2 text-sm text-[#6f6a62]">
                <li>Agenda online con tus horarios</li>
                <li>Confirmación manual de cada reserva</li>
                <li>Link para tu Instagram</li>
                <li>Ficha de clientes</li>
              </ul>
              <Link href="/probar" className="mt-8 block rounded-full py-3 text-center text-sm" style={{ border: "1px solid #1A1612" }}>
                Probar 7 días
              </Link>
            </article>
            <article className="rounded-[28px] p-6" style={{ background: "#1A1612", color: "#F6F1E8" }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] tracking-[0.14em] text-[#b8b0a4]">PLAN AUTOMÁTICO</p>
                <span className="rounded-full px-3 py-1 text-[10px] tracking-[0.1em]" style={{ background: "#3a342c" }}>
                  RECOMENDADO
                </span>
              </div>
              <p className="mt-3 text-[36px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                ${auto.toLocaleString("es-UY")} <span className="text-base">/mes</span>
              </p>
              <p className="mt-2 text-sm text-[#d7cfc4]">La agenda se llena sola y avisa por vos.</p>
              <ul className="mt-5 space-y-2 text-sm text-[#d7cfc4]">
                <li>Todo lo del plan Manual</li>
                <li>Reservas y confirmaciones automáticas</li>
                <li>Recordatorios y avisos por WhatsApp</li>
                <li>Lista de espera y control de ausencias</li>
                <li>Servicios ilimitados</li>
              </ul>
              <Link href="/probar" className="mt-8 block rounded-full py-3 text-center text-sm" style={{ background: "#F6F1E8", color: "#1A1612" }}>
                Probar 7 días
              </Link>
            </article>
          </div>
        </section>

        <section className="mt-20 rounded-[28px] px-6 py-12 text-center" style={{ background: "#1A1612", color: "#F6F1E8" }}>
          <h2 className="text-[28px] md:text-[32px]" style={{ fontFamily: "Georgia, Times, serif" }}>
            Probá 7 días en tu local.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#d7cfc4]">Te armamos la agenda con tus servicios y horarios. Si no te sirve, la cancelás.</p>
          <Link href="/probar" className="mt-6 inline-flex rounded-full px-6 py-3 text-sm" style={{ background: "#F6F1E8", color: "#1A1612" }}>
            Probar 7 días
          </Link>
        </section>

        <footer className="mt-16 grid gap-6 text-[13px] text-[#8A8378] md:grid-cols-2">
          <div>
            <p style={{ fontFamily: "Georgia, Times, serif", color: "#1A1612" }}>RESERVO APPS</p>
            <p className="mt-2 max-w-sm">Agendas online para negocios locales de todo el Uruguay.</p>
            <p className="mt-4 text-[12px]">
              BELLO BRUN FEDERICO YAIR · RUT 040291740013
              <br />
              Montevideo 710 101, Juan Lacaze, Colonia
            </p>
          </div>
          <div className="md:text-right">
            <p>¿Hablamos?</p>
            <a href={WA} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Escribinos por WhatsApp
            </a>
            <p className="mt-4">
              <Link href="/precios">Precios</Link>
              {" · "}
              <Link href="/legal/terminos">Términos</Link>
              {" · "}
              <Link href="/legal/privacidad">Privacidad</Link>
            </p>
            <p className="mt-3">© 2026 Reservo Apps · Montevideo, Uruguay</p>
          </div>
        </footer>
      </div>
    </main>
  );
}"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const WA = "https://wa.me/59897344643?text=" + encodeURIComponent("Hola Federico, consulta por Reservo Apps");

const HORAS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const ACTIVA = "11:30";

const rubros = [
  { t: "Barbería", d: "Corte y barba" },
  { t: "Pestañas y uñas", d: "Lifting y esmaltado" },
  { t: "Peluquería", d: "Color y corte" },
  { t: "Estudios", d: "Consultas y clases" },
  { t: "Oficios", d: "Visitas a domicilio" },
  { t: "Canina", d: "Baño y corte" },
];

export default function HomePage() {
  const [manual, setManual] = useState(890);
  const [auto, setAuto] = useState(1490);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("reservo_ajustes").select("precio_manual, precio_automatico").eq("id", 1).maybeSingle();
        if (data?.precio_manual) setManual(Number(data.precio_manual));
        if (data?.precio_automatico) setAuto(Number(data.precio_automatico));
      } catch {
        /* fallback */
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(#F4EFE4, #F7F3EC)", color: "#1A1612" }}>
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(244,239,228,.88)", borderBottom: "1px solid rgba(26,22,18,.06)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ background: "#1A1612", color: "#F6F1E8", fontFamily: "Georgia, Times, serif" }}>
              R
            </span>
            <span className="text-[11px] tracking-[0.16em]" style={{ fontFamily: "Georgia, Times, serif" }}>
              RESERVO APPS
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#6f6a62] md:flex">
            <a href="#agenda">La agenda</a>
            <a href="#rubros">Rubros</a>
            <a href="#planes">Planes</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="hidden sm:inline">
              Ingresar
            </Link>
            <Link href="/probar" className="rounded-full px-4 py-2" style={{ background: "#1A1612", color: "#F6F1E8" }}>
              Probar 7 días
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-10 pb-20 md:pt-16">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] tracking-[0.18em] text-[#8A8378]">RESERVAS ONLINE · URUGUAY</p>
            <h1 className="text-[36px] leading-[1.08] md:text-[44px]" style={{ fontFamily: "Georgia, Times, serif" }}>
              Apps de reservas
              <br />
              para negocios
              <br />
              locales.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-6 text-[#6f6a62]">
              Tus clientes eligen el horario desde el celular y el turno queda agendado al instante. Vos ves todo ordenado: agenda, clientes, recordatorios y avisos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/probar" className="rounded-full px-6 py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
                Probar 7 días
              </Link>
              <a href="#agenda" className="rounded-full px-6 py-3 text-sm" style={{ border: "1px solid #1A1612" }}>
                Ver la agenda
              </a>
            </div>
            <p className="mt-3 text-[12px] text-[#8A8378]">Sin tarjeta. Te dejamos la agenda lista el mismo día.</p>
          </div>

          <div id="agenda" className="rounded-[28px] bg-white/80 p-5 shadow-sm" style={{ border: "1px solid rgba(26,22,18,.08)" }}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[17px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Diano Barbería
                </p>
                <p className="text-[12px] text-[#8A8378]">Miércoles · Ciudad Vieja</p>
              </div>
              <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#EFE8DC" }}>
                Corte + barba
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HORAS.map((h) => (
                <span
                  key={h}
                  className="rounded-full py-2 text-center text-[12px]"
                  style={{
                    background: h === ACTIVA ? "#1A1612" : "#F3EEE4",
                    color: h === ACTIVA ? "#F6F1E8" : "#1A1612",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F6F1E8" }}>
              <div>
                <p className="text-sm">Mateo · 11:30 · Corte + barba</p>
                <p className="text-[11px] text-[#8A8378]">Recordatorio enviado 1 hora antes por WhatsApp</p>
              </div>
              <span className="rounded-full px-3 py-1 text-[10px] tracking-[0.08em]" style={{ background: "#1A1612", color: "#F6F1E8" }}>
                CONFIRMADO
              </span>
            </div>
          </div>
        </section>

        <section id="rubros" className="mt-20">
          <h2 className="text-[32px] leading-9" style={{ fontFamily: "Georgia, Times, serif" }}>
            Pensada para el local
            <br />
            del barrio.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[#6f6a62]">Elegí tu rubro y arrancás con servicios, duraciones y horarios ya armados.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
            {rubros.map((r) => (
              <article key={r.t} className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.55)", border: "1px solid rgba(26,22,18,.06)" }}>
                <p className="text-sm">{r.t}</p>
                <p className="text-[12px] text-[#8A8378]">{r.d}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link href="/b/diano" className="group relative block h-56 overflow-hidden rounded-[24px]">
              <img src="/IMG_9774.jpeg" alt="Demo barbería" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-[20px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Agenda para barberías y oficios.
                </p>
                <p className="text-[13px] text-white/85">Turnos, recordatorios y clientes.</p>
                <p className="mt-2 text-[11px] tracking-[0.12em]">VER DEMO →</p>
              </div>
            </Link>
            <Link href="/b/vale-studio" className="group relative block h-56 overflow-hidden rounded-[24px]">
              <img src="/IMG_9775.jpeg" alt="Demo estudio" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4" style={{ color: "#1A1612" }}>
                <p className="text-[20px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Agenda para estudios y profesionales.
                </p>
                <p className="text-[13px] text-[#5c574e]">Organizá tu semana sin mensajes.</p>
                <p className="mt-2 text-[11px] tracking-[0.12em]">VER DEMO →</p>
              </div>
            </Link>
          </div>
        </section>

        <section id="planes" className="mt-20">
          <h2 className="text-[32px] leading-9" style={{ fontFamily: "Georgia, Times, serif" }}>
            Dos planes, sin letra chica.
          </h2>
          <p className="mt-3 text-sm text-[#6f6a62]">Precio mensual en pesos. Cancelás cuando quieras.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-[28px] bg-white/70 p-6" style={{ border: "1px solid rgba(26,22,18,.08)" }}>
              <p className="text-[11px] tracking-[0.14em] text-[#8A8378]">PLAN MANUAL</p>
              <p className="mt-3 text-[36px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                ${manual.toLocaleString("es-UY")} <span className="text-base">/mes</span>
              </p>
              <p className="mt-2 text-sm text-[#6f6a62]">Para empezar a tu ritmo: vos confirmás cada turno.</p>
              <ul className="mt-5 space-y-2 text-sm text-[#6f6a62]">
                <li>Agenda online con tus horarios</li>
                <li>Confirmación manual de cada reserva</li>
                <li>Link para tu Instagram</li>
                <li>Ficha de clientes</li>
              </ul>
              <Link href="/probar" className="mt-8 block rounded-full py-3 text-center text-sm" style={{ border: "1px solid #1A1612" }}>
                Probar 7 días
              </Link>
            </article>
            <article className="rounded-[28px] p-6" style={{ background: "#1A1612", color: "#F6F1E8" }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] tracking-[0.14em] text-[#b8b0a4]">PLAN AUTOMÁTICO</p>
                <span className="rounded-full px-3 py-1 text-[10px] tracking-[0.1em]" style={{ background: "#3a342c" }}>
                  RECOMENDADO
                </span>
              </div>
              <p className="mt-3 text-[36px]" style={{ fontFamily: "Georgia, Times, serif" }}>
                ${auto.toLocaleString("es-UY")} <span className="text-base">/mes</span>
              </p>
              <p className="mt-2 text-sm text-[#d7cfc4]">La agenda se llena sola y avisa por vos.</p>
              <ul className="mt-5 space-y-2 text-sm text-[#d7cfc4]">
                <li>Todo lo del plan Manual</li>
                <li>Reservas y confirmaciones automáticas</li>
                <li>Recordatorios y avisos por WhatsApp</li>
                <li>Lista de espera y control de ausencias</li>
                <li>Servicios ilimitados</li>
              </ul>
              <Link href="/probar" className="mt-8 block rounded-full py-3 text-center text-sm" style={{ background: "#F6F1E8", color: "#1A1612" }}>
                Probar 7 días
              </Link>
            </article>
          </div>
        </section>

        <section className="mt-20 rounded-[28px] px-6 py-12 text-center" style={{ background: "#1A1612", color: "#F6F1E8" }}>
          <h2 className="text-[28px] md:text-[32px]" style={{ fontFamily: "Georgia, Times, serif" }}>
            Probá 7 días en tu local.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#d7cfc4]">Te armamos la agenda con tus servicios y horarios. Si no te sirve, la cancelás.</p>
          <Link href="/probar" className="mt-6 inline-flex rounded-full px-6 py-3 text-sm" style={{ background: "#F6F1E8", color: "#1A1612" }}>
            Probar 7 días
          </Link>
        </section>

        <footer className="mt-16 grid gap-6 text-[13px] text-[#8A8378] md:grid-cols-2">
          <div>
            <p style={{ fontFamily: "Georgia, Times, serif", color: "#1A1612" }}>RESERVO APPS</p>
            <p className="mt-2 max-w-sm">Agendas online para negocios locales de todo el Uruguay.</p>
            <p className="mt-4 text-[12px]">
              BELLO BRUN FEDERICO YAIR · RUT 040291740013
              <br />
              Montevideo 710 101, Juan Lacaze, Colonia
            </p>
          </div>
          <div className="md:text-right">
            <p>¿Hablamos?</p>
            <a href={WA} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Escribinos por WhatsApp
            </a>
            <p className="mt-4">
              <Link href="/precios">Precios</Link>
              {" · "}
              <Link href="/legal/terminos">Términos</Link>
              {" · "}
              <Link href="/legal/privacidad">Privacidad</Link>
            </p>
            <p className="mt-3">© 2026 Reservo Apps · Montevideo, Uruguay</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
