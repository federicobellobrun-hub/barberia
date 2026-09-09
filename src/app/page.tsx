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

function Card({
  title,
  text,
  href,
  label,
  img,
  delay,
}: {
  title: string;
  text: string;
  href?: string;
  label: string;
  img: string;
  delay: string;
}) {
  const inner = (
    <div className="grid grid-cols-2 h-full">
      <div className="p-4 flex flex-col justify-between">
        <div>
          <p className="text-lg leading-6" style={{ fontFamily: "Georgia, Times, serif" }}>
            {title}
          </p>
          <div className="w-8 h-px bg-[#1C1712] my-2" />
          <p className="text-xs leading-4 text-[#6f675e]">{text}</p>
        </div>
        <span className="text-sm underline underline-offset-2">{label}</span>
      </div>
      <img src={img} alt={title} className="h-full w-full object-cover" />
    </div>
  );

  return href ? (
    <Link href={href} className="card rise mb-3 block h-[168px] overflow-hidden rounded-2xl" style={{ background: "#EFE8DC", animationDelay: delay }}>
      {inner}
    </Link>
  ) : (
    <article className="card rise mb-3 h-[168px] overflow-hidden rounded-2xl" style={{ background: "#EFE8DC", animationDelay: delay }}>
      {inner}
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen relative" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='0.35'/></svg>\")",
        }}
      />
      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: rise .7s ease both; }
        .card { transition: transform .25s ease, box-shadow .25s ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(28,23,18,.08); }
      `}</style>

      <div className="relative mx-auto max-w-md px-5 pt-6 pb-16">
        <header className="flex items-start justify-between mb-12">
          <Logo />
          <Link href="/login" className="mt-2 text-[13px] text-[#9a9388] hover:text-[#1C1712]">
            Ingresar
          </Link>
        </header>

        <h1 className="rise text-[34px] leading-[1.15] mb-4" style={{ fontFamily: "Georgia, Times, serif" }}>
          Apps de reservas para negocios locales.
        </h1>
        <p className="rise text-sm text-[#7a7268] mb-12" style={{ animationDelay: ".08s" }}>
          Agenda, clientes y avisos para tu local.
        </p>

        <p className="text-[11px] tracking-[0.16em] uppercase text-[#9a9388] mb-3">Nuestras apps</p>

        <Card
          title="Barberías"
          text="Citas, clientes y servicios para tu barbería."
          href="/b/diano"
          label="Explorar →"
          img="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80"
          delay=".16s"
        />
        <Card
          title="Pestañas y uñas"
          text="Agenda para pestañas, uñas y estética."
          href="/b/vale-studio"
          label="Explorar →"
          img="https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800&q=80&fit=crop"
          delay=".24s"
        />

        <footer className="mt-16 text-center text-[11px] leading-5 text-[#9a9388]">
          <p className="tracking-[0.12em]">Hecho en Uruguay · reservoapps.com</p>
          <p className="mt-3">
            Reservo Apps es un producto de BELLO BRUN FEDERICO YAIR
            <br />
            RUT 040291740013
            <br />
            Montevideo 710 101, Juan Lacaze, Colonia
          </p>
        </footer>
      </div>
    </main>
  );
}
