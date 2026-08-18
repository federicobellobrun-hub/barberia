import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-amber-500">Barbería</h1>
        <p className="text-zinc-400">Reservá tu turno online</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/reservar"
            className="bg-amber-500 text-black font-semibold py-3 rounded-xl"
          >
            Reservar turno
          </Link>
          <Link
            href="/login"
            className="border border-zinc-700 text-zinc-300 py-3 rounded-xl"
          >
            Ingresar al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
