"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Servicio = {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
};

export default function ReservarPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("servicios")
          .select("id, nombre, duracion_minutos, precio")
          .eq("activo", true)
          .order("orden");

        if (error) {
          setError(error.message);
        } else {
          setServicios(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-amber-500">Nuestros servicios</h1>
        <p className="text-zinc-400 mt-2 mb-8">Elegí un servicio para reservar</p>

        {loading && <p className="text-zinc-500">Cargando servicios...</p>}

        {error && (
          <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}

        {!loading && !error && servicios.length === 0 && (
          <p className="text-zinc-500">Todavía no hay servicios cargados.</p>
        )}

        <div className="space-y-4">
          {servicios.map((s) => (
            <div
              key={s.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-sm text-zinc-400">
                  {s.duracion_minutos} min · ${s.precio}
                </p>
              </div>
              <button className="bg-amber-500 text-black text-sm font-semibold px-4 py-2 rounded-lg">
                Reservar
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
