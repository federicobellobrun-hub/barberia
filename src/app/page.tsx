import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#c4a574]">Barbería</p>
        <h1 className="font-display text-5xl mt-4 mb-3">Reserva tu turno</h1>
        <p className="text-[#9a958c] text-sm mb-10">Agenda simple. Atención precisa.</p>
        <div className="space-y-3">
          <Link
            href="/reservar"
            className="block bg-[#c4a574] text-black py-3.5 text-sm tracking-wide"
          >
            Reservar
          </Link>
          <Link
            href="/login"
            className="block border border-[#222226] py-3.5 text-sm text-[#9a958c]"
          >
            Panel
          </Link>
        </div>
      </div>
    </main>
  );
}
