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
        <span className="block text-[22px] tracking-[0.04em]" style={{ fontFamily: "Georgia, Times, serif" }}>
          RESERVO
        </span>
        <span className="block text-[10px] tracking-[0.32em] text-[#7a7268]">APPS</span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: rise .7s ease both; }
        .card:hover { transform: translateY(-2px); }
        .card { transition: transform .25s ease, box-shadow .25s ease; }
        .card:hover { box-shadow: 0 10px 24px rgba(28,23,18,.08); }
      `}</style>

      <div className="mx-auto max-w-md px-5 pt-6 pb-16">
        <header className="flex items-start justify-between mb-10">
          <Logo />
          <Link href="/login" className="mt-2 text-[13px] text-[#9a9388] hover:text-[#1C1712]">
            Ingresar
          </Link>
        </header>

        <h1 className="rise text-[34px] leading-[1.15] mb-4" style={{ fontFamily: "Georgia, Times, serif" }}>
          Apps de reservas para negocios locales.
        </h1>
        <p className="rise text-sm text-[#7a7268] mb-8" style={{ animationDelay: ".08s" }}>
          Agenda, clientes y avisos para tu local.
        </p>

        <Link
          href="/b/diano"
          className="rise inline-block rounded-full px-6 py-3 text-[13px] mb-10"
          style={{ background: "#1C1712", color: "#F5F0E8", animationDelay: ".14s" }}
        >
          Ver demo barbería
        </Link>

        <p className="text-[11px] tracking-[0.16em] uppercase text-[#9a9388] mb-3">Nuestras apps</p>

        <article className="card rise overflow-hidden rounded-2xl mb-3" style={{ background: "#EFE8DC", animationDelay: ".2s" }}>
          <div className="grid grid-cols-2 min-h-[150px]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Barberías
                </p>
                <div className="w-8 h-px bg-[#1C1712] my-2" />
                <p className="text-xs leading-4 text-[#6f675e]">Citas, clientes y servicios para tu barbería.</p>
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

        <article className="card rise overflow-hidden rounded-2xl" style={{ background: "#EFE8DC", animationDelay: ".28s" }}>
          <div className="grid grid-cols-2 min-h-[150px]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                  Uñas y pestañas
                </p>
                <div className="w-8 h-px bg-[#1C1712] my-2" />
                <p className="text-xs leading-4 text-[#6f675e]">Agenda para profesionales de estética.</p>
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
      </div>
    </main>
  );
}
