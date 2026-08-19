"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Bloqueo = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  todo_el_dia: boolean;
  motivo: string | null;
};

export default function BloqueosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bloqueos")
      .select("id, fecha_inicio, fecha_fin, todo_el_dia, motivo")
      .eq("barberia_id", id)
      .order("fecha_inicio", { ascending: false });

    if (error) setError(error.message);
    setBloqueos(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("barberia_id")
        .eq("auth_user_id", user.id)
        .single();

      if (error || !data?.barberia_id) {
        setError(error?.message || "No se encontró la barbería");
        setLoading(false);
        return;
      }

      setBarberiaId(data.barberia_id);
      await load(data.barberia_id);
      setLoading(false);
    };

    init();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId || !fechaInicio) return;

    setSaving(true);
    setError(null);

    const inicio = `${fechaInicio}T00:00:00-03:00`;
    const fin = `${fechaFin || fechaInicio}T23:59:59-03:00`;

    const supabase = createClient();
    const { error } = await supabase.from("bloqueos").insert({
      barberia_id: barberiaId,
      fecha_inicio: inicio,
      fecha_fin: fin,
      todo_el_dia: true,
      motivo: motivo.trim() || "Día bloqueado",
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setFechaInicio("");
    setFechaFin("");
    setMotivo("");
    await load(barberiaId);
    setSaving(false);
  };

  const eliminar = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("bloqueos").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await load(barberiaId);
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-500">Bloqueos</h1>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
          Volver a agenda
        </Link>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <form onSubmit={guardar} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Bloquear día o rango</h2>

          {error && (
            <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Desde</label>
            <input
              type="date"
              required
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Hasta (opcional)</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Motivo</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Feriado, vacaciones, día libre..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3"
            />
          </div>

          <button
            disabled={saving}
            className="w-full bg-amber-500 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Bloquear"}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-semibold">Días bloqueados</h2>
          {loading && <p className="text-zinc-500">Cargando...</p>}
          {!loading && bloqueos.length === 0 && (
            <p className="text-zinc-500">No hay bloqueos cargados.</p>
          )}

          {bloqueos.map((b) => {
            const desde = new Date(b.fecha_inicio).toLocaleDateString("es-UY");
            const hasta = new Date(b.fecha_fin).toLocaleDateString("es-UY");
            return (
              <div
                key={b.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">
                    {desde === hasta ? desde : `${desde} → ${hasta}`}
                  </p>
                  <p className="text-sm text-zinc-400">{b.motivo || "Día bloqueado"}</p>
                </div>
                <button
                  onClick={() => eliminar(b.id)}
                  className="text-sm text-red-400"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
