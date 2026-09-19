"use client";

import Link from "next/link";

const WA = "https://wa.me/59897344643?text=" + encodeURIComponent("Hola Federico, consulta por Reservo Apps");

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#F6F1E8", color: "#1A1612" }}>
      <div className="mx-auto max-w-md px-5 pt-6 pb-16">
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-medium"
              style={{ background: "#1A1612", color: "#F6F1E8", fontFamily: "Georgia, Times, serif" }}
            >
              R
            </span>
            <span className="text-[12px] tracking-[0.14em]" style={{ fontFamily: "Georgia, Times, serif" }}>
              RESERVO APPS
            </span>
          </Link>
          <Link href="/login" className="text-[13px]">
            Ingresar
          </Link>
        </header>

        <h1 className="text-[36px] leading-[1.08] mb-4" style={{ fontFamily: "Georgia, Times, serif" }}>
          Apps de reservas
          <br />
          para negocios
          <br />
          locales.
        </h1>
        <p className="text-[15px] text-[#8A8378] mb-5">Agenda, clientes, recordatorios y avisos.</p>

        <div className="flex flex-wrap items-center gap-2 mb-7">
          <span className="text-[13px] text-[#8A8378]">Rubro</span>
          {["Belleza", "Oficio", "Estudio", "Canina"].map((r) => (
            <span key={r} className="rounded-full px-3.5 py-1.5 text-[13px]" style={{ background: "#EDE6D8" }}>
              {r}
            </span>
          ))}
        </div>

        <Link href="/probar" className="mb-8 inline-flex rounded-2xl px-7 py-3.5 text-[15px]" style={{ background: "#1A1612", color: "#F6F1E8" }}>
          Probar 7 días
        </Link>

        <Link href="/b/diano" className="relative mb-3 block h-[168px] overflow-hidden rounded-[22px]">
          <img src="/IMG_9774.jpeg" alt="Diano" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.12) 55%, transparent 100%)" }} />
          <div className="absolute left-4 bottom-4 right-8 text-white">
            <p className="text-[22px] leading-7" style={{ fontFamily: "Georgia, Times, serif" }}>
              Agenda para barberías
              <br />
              y oficios.
            </p>
            <p className="mt-1 text-[13px] text-white/85">Turnos, recordatorios y clientes.</p>
          </div>
        </Link>

        <Link href="/b/vale-studio" className="relative mb-10 block h-[168px] overflow-hidden rounded-[22px]">
          <img src="/IMG_9775.jpeg" alt="Vale" className="h-full w-full object-cover" />
          <div className="absolute left-4 bottom-4 right-8" style={{ color: "#1A1612" }}>
            <p className="text-[22px] leading-7" style={{ fontFamily: "Georgia, Times, serif" }}>
              Agenda para estudios
              <br />
              y profesionales.
            </p>
            <p className="mt-1 text-[13px] text-[#5c574e]">Organizá tu tiempo y tu clientela.</p>
          </div>
        </Link>

        <footer className="text-center text-[12px] leading-5 text-[#8A8378]">
          <p>
            <Link href="/precios">Precios</Link>
            {" · "}
            <Link href="/legal/terminos">Términos</Link>
            {" · "}
            <Link href="/legal/privacidad">Privacidad</Link>
          </p>
          <p className="mt-3">
            Reservo Apps es un producto de BELLO BRUN FEDERICO YAIR,
            <br />
            RUT 040291740013, Montevideo 710 101 Juan Lacaze Colonia.
          </p>
        </footer>
      </div>

      <a
        href={WA}
        target="_blank"
        rel="noreferrer"
        className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ right: 16, bottom: 20, background: "#1A1612", color: "#F6F1E8" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </main>
  );
}
