import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-10">
          <span className="text-xl">☰</span>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>
              Barbershop
            </p>
          </div>
          <ThemeToggle />
        </header>

        <h1 className="text-[34px] font-semibold tracking-tight leading-9">
          Reservá tu turno
        </h1>
        <p className="mt-2 mb-8" style={{ color: "var(--muted)" }}>
          Agenda simple. Atención precisa.
        </p>

        <div
          className="rounded-2xl p-4 mb-6 flex gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: "#eee4d4" }}
          >
            ✂
          </div>
          <div>
            <p className="font-medium text-sm">Diano Barbershop</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Elegí servicio, día y hora.
            </p>
          </div>
        </div>

        <Link
          href="/reservar"
          className="block text-center rounded-2xl py-4 font-medium mb-3"
          style={{ background: "#1d1d1f", color: "#fff" }}
        >
          Reservar
        </Link>
        <Link
          href="/tienda"
          className="block text-center rounded-2xl py-4 mb-3"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          Productos
        </Link>
        <Link
          href="/login"
          className="block text-center rounded-2xl py-4"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          Panel del barbero
        </Link>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--card)", borderColor: "var(--line)" }}
      >
        <div className="max-w-md mx-auto grid grid-cols-3 text-center text-xs py-3">
          <span className="font-medium">Inicio</span>
          <Link href="/reservar" style={{ color: "var(--muted)" }}>
            Reservar
          </Link>
          <Link href="/tienda" style={{ color: "var(--muted)" }}>
            Tienda
          </Link>
        </div>
      </nav>
    </main>
  );
}
