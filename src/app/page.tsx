import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="min-h-screen px-8 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-end mb-16">
          <ThemeToggle />
        </div>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Barbería
        </p>
        <h1 className="text-5xl font-semibold tracking-tight mt-3 mb-4">
          Reservá tu turno
        </h1>
        <p className="text-lg mb-12" style={{ color: "var(--muted)" }}>
          Elegí servicio, día y hora. Simple.
        </p>

        <div className="space-y-4">
          <Link
            href="/reservar"
            className="block text-center rounded-2xl py-4 font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Reservar
          </Link>
          <Link
            href="/login"
            className="block text-center rounded-2xl py-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
            }}
          >
            Entrar al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
