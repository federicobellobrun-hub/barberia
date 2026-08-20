"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Cliente = {
  id: string;
  barberia_id: string;
  nombre: string;
  telefono: string;
  notas: string | null;
};

type Turno = {
  id: string;
  fecha_hora: string;
  estado: string;
  duracion_minutos: number;
  servicios: { nombre: string; precio: number } | { nombre: string; precio: number }[] | null;
};

type Foto = {
  id: string;
  url: string;
  descripcion: string | null;
  turno_id: string;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

export default function FichaClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [notas, setNotas] = useState("");
  const [turnoFoto, setTurnoFoto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data: c, error: e1 } = await supabase
      .from("clientes")
      .select("id, barberia_id, nombre, telefono, notas")
      .eq("id", id)
      .single();
    if (e1) return setError(e1.message);

    setCliente(c);
    setNotas(c.notas || "");

    const { data: t } = await supabase
      .from("turnos")
      .select("id, fecha_hora, estado, duracion_minutos, servicios(nombre, precio)")
      .eq("cliente_id", id)
      .order("fecha_hora", { ascending: false });

    const lista = (t as any) || [];
    setTurnos(lista);
    if (lista[0] && !turnoFoto) setTurnoFoto(lista[0].id);

    const ids = lista.map((x: Turno) => x.id);
    if (ids.length) {
      const { data: f } = await supabase
        .from("fotos")
        .select("id, url, descripcion, turno_id")
        .in("turno_id", ids)
        .order("created_at", { ascending: false });
      setFotos(f || []);
    } else {
      setFotos([]);
    }
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
      await load();
    };
    init();
  }, [id]);

  const guardarNotas = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("clientes").update({ notas }).eq("id", id);
    if (error) setError(error.message);
    else {
      setOk("Notas guardadas");
      setError(null);
    }
  };

  const subirFoto = async (file: File) => {
    if (!cliente) return;
    if (!turnoFoto) {
      setError("Elegí a qué visita pertenece la foto");
      return;
    }
    const supabase = createClient();
    const path = `${cliente.barberia_id}/${cliente.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);

    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error: insErr } = await supabase.from("fotos").insert({
      barberia_id: cliente.barberia_id,
      turno_id: turnoFoto,
      url: data.publicUrl,
      descripcion: "Foto de corte",
    });
    if (insErr) setError(insErr.message);
    else {
      setOk("Foto subida");
      await load();
    }
  };

  if (!cliente) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center">
        Cargando ficha...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1408_0%,#09090b_45%)]">
      <header className="border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-500/80">Ficha cliente</p>
            <h1 className="text-xl font-semibold">{cliente.nombre}</h1>
          </div>
          <Link href="/dashboard/clientes" className="text-sm text-zinc-400 hover:text-white">
            Volver
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <p className="text-2xl font-semibold">{cliente.nombre}</p>
          <p className="text-zinc-400 mt-1">{cliente.telefono}</p>
          <p className="text-sm text-zinc-500 mt-3">{turnos.length} visitas registradas</p>
        </div>

        {error && <p className="text-red-400">{error}</p>}
        {ok && <p className="text-emerald-400">{ok}</p>}

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-3">
          <h2 className="font-semibold">Notas del corte</h2>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={5}
            placeholder="Fade alto, no muy corto arriba, barba cuadrada, alérgico a..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:border-amber-500/50"
          />
          <button
            onClick={guardarNotas}
            className="bg-amber-500 text-black font-semibold px-5 py-2 rounded-full"
          >
            Guardar notas
          </button>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
          <h2 className="font-semibold">Fotos del corte</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={turnoFoto}
              onChange={(e) => setTurnoFoto(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2"
            >
              {turnos.map((t) => (
                <option key={t.id} value={t.id}>
                  {new Date(t.fecha_hora).toLocaleDateString("es-UY")} · {one(t.servicios)?.nombre}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subirFoto(file);
              }}
              className="text-sm text-zinc-400"
            />
          </div>

          {fotos.length === 0 && <p className="text-zinc-500 text-sm">Todavía no hay fotos.</p>}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {fotos.map((f) => (
              <img
                key={f.id}
                src={f.url}
                alt={f.descripcion || "Corte"}
                className="w-full h-44 object-cover rounded-2xl border border-zinc-800"
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Qué se hizo</h2>
          {turnos.length === 0 && <p className="text-zinc-500">Sin visitas todavía.</p>}
          {turnos.map((t) => (
            <div key={t.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-amber-400 font-medium">{one(t.servicios)?.nombre || "Servicio"}</p>
              <p className="text-sm text-zinc-400 mt-1">
                {new Date(t.fecha_hora).toLocaleString("es-UY")} · {t.duracion_minutos} min · $
                {one(t.servicios)?.precio || 0}
              </p>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mt-2">{t.estado}</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
