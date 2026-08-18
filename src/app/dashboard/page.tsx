"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function DashboardPage() {
  const [nombre, setNombre] = useState("Barbero");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("auth_user_id", user.id)
        .single();

      if (data?.nombre) setNombre(data.nombre);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-zinc-400">
        Cargando...
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-500">Barbería</h1>
        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white">
          Cerrar sesión
        </button>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Hola, {nombre}</h2>
          <p className="text-zinc-400 mt-1">Este es tu panel de control</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-sm text-zinc-400">Turnos hoy</p>
            <p className="text-3xl font-bold text-amber-500 mt-2">0</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-sm text-zinc-400">Ingresos hoy</p>
            <p className="text-3xl font-bold text-amber-500 mt-2">$0</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-sm text-zinc-400">Próximo cliente</p>
            <p className="text-3xl font-bold text-amber-500 mt-2">—</p>
          </div>
        </div>

        <p className="text-zinc-500 text-sm">
          Próximo paso: conectar la agenda y las reservas reales.
        </p>
      </section>
    </main>
  );
}
