"use client";

import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[20px]"
        style={{ border: "1.5px solid #1C1712", fontFamily: "Georgia, Times, serif" }}
      >
        R
      </span>
      <span className="leading-[1.05]">
        <span
          className="block text-[22px] tracking-[0.04em]"
          style={{ fontFamily: "Georgia, Times, serif" }}
        >
          RESERVO
        </span>
        <span className="block text-[10px] tracking-[0.32em] text-[#7a7268]">
          APPS
        </span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 pt-6 pb-16">
        <header className="flex items-start justify-between mb-8">
          <Logo />
          <Link href="/login" className="mt-2 text-sm text-[#7a7268]">
            Ingresar
          </Link>
        </header>

        <h1
          className="text-[34px] leading-[1.15] mb-6"
          style={{ fontFamily: "Georgia, Times, serif" }}
        >
          Apps de reservas para negocios locales.
        </h1>

        <div className="flex gap-2 mb-8">
          <Link
            href="/b/diano"
            className="flex-1 rounded-full py-3 text-center text-[13px]"
            style={{ background: "#1C1712", color: "#F5F0E8" }}
          >
            Ver demo barbería
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-full py-3 text-center text-[13px]"
            style={{ border: "1px solid #1C1712" }}
          >
            Entrar al panel
          </Link>
        </div>

        <article
          className="overflow-hidden rounded-2xl mb-3"
          style={{ background: "#EFE8DC" }}
        >
          <div className="grid grid-cols-2 min-h-[150px]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Barberías
                </p>
                <div className="w-8 h-px bg-[#1C1712] my-2" />
                <p className="text-xs leading-4 text-[#6f675e]">
                  Gestiona citas, clientes y servicios en tu barbería.
                </p>
              </div>
              <Link href="/b/diano" className="text-xs mt-3">
                Explorar →
              </Link>
            </div>
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80"
              alt="Barbería"
              className="h-full w-full object-cover"
            />
          </div>
        </article>

        <article
          className="overflow-hidden rounded-2xl"
          style={{ background: "#EFE8DC" }}
        >
          <div className="grid grid-cols-2 min-h-[150px]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Uñas y pestañas
                </p>
                <div className="w-8 h-px bg-[#1C1712] my-2" />
                <p className="text-xs leading-4 text-[#6f675e]">
                  Organizá agendas y fidelizá clientas de estética.
                </p>
              </div>
              <span className="text-xs mt-3 text-[#9a9388]">Próximamente</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80"
              alt="Uñas y pestañas"
              className="h-full w-full object-cover"
            />
          </div>
        </article>

        <p className="text-center text-[11px] mt-12 text-[#9a9388]">reservoapps.com</p>
      </div>
    </main>
  );
}
