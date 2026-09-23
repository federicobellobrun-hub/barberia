"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function HomePage() {
  const [manual, setManual] = useState(890);
  const [auto, setAuto] = useState(1490);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("reservo_ajustes").select("precio_manual, precio_automatico").eq("id", 1).maybeSingle();
      if (data?.precio_manual) setManual(data.precio_manual);
      if (data?.precio_automatico) setAuto(data.precio_automatico);
    };
    void load();
  }, []);

  const rubros = [
    ["Barbería", "Corte y barba"],
    ["Pestañas y uñas", "Lifting y esmaltado"],
    ["Peluquería", "Color y corte"],
    ["Canina", "Baño y corte"],
    ["Estudios", "Consultas y clases"],
    ["Oficios", "Visitas a domicilio"],
  ];

  return (
    <main className="min-h-screen" style={{ background: "#F6F1E8", color: "#1A1612" }}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
            style={{ border: "1.5px solid #1A1612", fontFamily: "Georgia, Times, serif" }}
          >
            R
          </span>
          <span>
            <span className="block leading-none" style={{ fontFamily: "Georgia, Times, serif", fontSize: "22px" }}>
              Reservo Apps
            </span>
            <span className="mt-1 block text-[10px] tracking-[0.16em]" style={{ color: "#8A8378" }}>
              APPS DE RESERVA PARA NEGOCIOS LOCALES
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/precios">Precios</Link>
          <Link href="/probar">Probar</Link>
          <Link href="/login">Ingresar</Link>
          <Link href="/panel" className="text-xs" style={{ opacity: 0.35 }}>
            Panel
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-12 pt-8 md:grid md:grid-cols-2 md:items-center md:gap-10">
        <div>
          <h1 className="text-4xl leading-tight md:text-5xl" style={{ fontFamily: "Georgia, Times, serif" }}>
            Tu negocio. Tus clientes. Tu agenda. Todo en un solo lugar.
          </h1>
          <p className="mt-4 max-w-md" style={{ color: "#5c564c" }}>
            Tus clientes eligen el horario desde el celular. Vos ves agenda, clientes, recordatorios y avisos. Sin contratos. Empezá en minutos.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/probar" className="rounded-full px-6 py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
              Probá 7 días gratis
            </Link>
            <Link href="#demos" className="rounded-full px-6 py-3 text-sm" style={{ border: "1px solid #d7d1c6" }}>
              Ver cómo funciona
            </Link>
          </div>
        </div>
        <div className="mt-10 rounded-3xl p-5 md:mt-0" style={{ background: "#fff", border: "1px solid #e6e0d4" }}>
          <p className="text-sm font-medium">Diano Barbería</p>
          <p className="text-xs" style={{ color: "#8A8378" }}>Miércoles · Ciudad Vieja</p>
          <p className="mt-3 text-sm">Corte + barba</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["09:00", "09:30", "10:00", "11:30", "14:00", "15:30"].map((h) => (
              <span key={h} className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid #e6e0d4" }}>
                {h}
              </span>
            ))}
          </div>
          <p className="mt-4 rounded-2xl px-3 py-2 text-xs" style={{ background: "#F6F1E8" }}>
            Mateo · 11:30 · Confirmado · recordatorio por WhatsApp
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-12">
        <h2 className="text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Pensada para el local del barrio
        </h2>
        <p className="mt-2 mb-5 text-sm" style={{ color: "#5c564c" }}>
          Elegí el rubro y arrancás con servicios y horarios.
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {rubros.map(([t, d]) => (
            <div key={t} className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #e6e0d4" }}>
              <p className="font-medium">{t}</p>
              <p className="text-sm" style={{ color: "#8A8378" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demos" className="mx-auto max-w-5xl px-5 pb-12">
        <h2 className="mb-4 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Mirá una demo
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="https://diano.reservoapps.com" className="group overflow-hidden rounded-2xl" style={{ background: "#fff", border: "1px solid #e6e0d4" }}>
            <div className="overflow-hidden">
              <img src="/IMG_9774.jpeg" alt="Diano" className="h-56 w-full object-cover transition duration-500 group-hover:scale-110" />
            </div>
            <div className="p-4">
              <p className="font-medium">Diano Barbershop</p>
              <p className="text-sm" style={{ color: "#8A8378" }}>Ver demo barbería →</p>
            </div>
          </Link>
          <Link href="https://vale-studio.reservoapps.com" className="group overflow-hidden rounded-2xl" style={{ background: "#fff", border: "1px solid #e6e0d4" }}>
            <div className="overflow-hidden">
              <img src="/IMG_9775.jpeg" alt="Vale" className="h-56 w-full object-cover transition duration-500 group-hover:scale-110" />
            </div>
            <div className="p-4">
              <p className="font-medium">Vale Studio</p>
              <p className="text-sm" style={{ color: "#8A8378" }}>Ver demo pestañas y uñas →</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-12">
        <h2 className="mb-4 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Dos planes, sin letra chica
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e6e0d4" }}>
            <p className="text-sm">Manual</p>
            <p className="mt-1 text-3xl">${manual} <span className="text-sm">/mes</span></p>
            <ul className="mt-4 space-y-1 text-sm">
              <li>Agenda online</li>
              <li>Confirmación manual</li>
              <li>Link para Instagram</li>
              <li>Ficha de clientes</li>
            </ul>
            <Link href="/probar" className="mt-5 block rounded-full py-3 text-center text-sm" style={{ border: "1px solid #1A1612" }}>
              Probar 7 días
            </Link>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "#1A1612", color: "#F6F1E8" }}>
            <p className="text-sm">Automático</p>
            <p className="mt-1 text-3xl">${auto} <span className="text-sm">/mes</span></p>
            <ul className="mt-4 space-y-1 text-sm">
              <li>Todo lo del Manual</li>
              <li>Confirmaciones solas</li>
              <li>Recordatorios WhatsApp</li>
              <li>Lista de espera</li>
            </ul>
            <Link href="/probar" className="mt-5 block rounded-full py-3 text-center text-sm" style={{ background: "#F6F1E8", color: "#1A1612" }}>
              Probar 7 días
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16 text-center">
        <h2 className="text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Probá 7 días en tu local
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#5c564c" }}>
          Armás la agenda con tus servicios. Si no te sirve, la cancelás.
        </p>
        <Link href="/probar" className="mt-5 inline-block rounded-full px-6 py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
          Empezar prueba
        </Link>
      </section>

      <footer className="mx-auto max-w-5xl px-5 pb-10 text-xs" style={{ color: "#8A8378" }}>
        <p>Reservo Apps · Hecho en Uruguay</p>
        <p className="mt-1">Federico Yair Bello Brun · RUT 040291740013</p>
        <div className="mt-2 flex gap-4">
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </div>
      </footer>
    </main>
  );
}
