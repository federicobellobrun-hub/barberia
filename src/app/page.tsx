"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#F6F1E8", color: "#1A1612" }}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-xl tracking-tight" style={{ fontFamily: "Georgia, Times, serif" }}>
          Reservo Apps
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/precios">Precios</Link>
          <Link href="/probar">Probar</Link>
          <Link href="/login">Ingresar</Link>
          <Link href="/panel" className="text-xs" style={{ opacity: 0.4 }}>
            Panel
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-10">
        <p className="text-xs tracking-[0.18em]" style={{ color: "#8A8378" }}>
          APPS DE RESERVA PARA NEGOCIOS LOCALES
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight md:text-5xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Tu negocio. Tus clientes. Tu agenda. Todo en un solo lugar.
        </h1>
        <p className="mt-4 max-w-xl text-base" style={{ color: "#5c564c" }}>
          Reservas online, agenda, clientes y recordatorios. Sin contratos. Empezá en minutos.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/probar" className="rounded-full px-6 py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
            Probá 7 días gratis
          </Link>
          <Link href="/precios" className="rounded-full px-6 py-3 text-sm" style={{ border: "1px solid #d7d1c6" }}>
            Ver precios
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-16 md:grid-cols-2">
        <Link href="https://diano.reservoapps.com" className="overflow-hidden rounded-2xl" style={{ border: "1px solid #e6e0d4", background: "#fff" }}>
          <img src="/IMG_9774.jpeg" alt="Diano Barbershop" className="h-56 w-full object-cover" />
          <div className="p-4">
            <p className="font-medium">Diano Barbershop</p>
            <p className="text-sm" style={{ color: "#8A8378" }}>Ver demo barbería</p>
          </div>
        </Link>
        <Link href="https://vale-studio.reservoapps.com" className="overflow-hidden rounded-2xl" style={{ border: "1px solid #e6e0d4", background: "#fff" }}>
          <img src="/IMG_9775.jpeg" alt="Vale Studio" className="h-56 w-full object-cover" />
          <div className="p-4">
            <p className="font-medium">Vale Studio</p>
            <p className="text-sm" style={{ color: "#8A8378" }}>Ver demo pestañas y uñas</p>
          </div>
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
