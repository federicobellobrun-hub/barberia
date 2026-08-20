"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

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
type Foto = { id: string; url: string; descripcion: string | null; turno_id: string };

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
  const [actual, setActual] = useState(0);
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
    if (lista[0]) setTurnoFoto((prev) => prev || lista[0].id);

    const ids = lista.map((x: Turno) => x.id);
    if (ids.length) {
      const { data: f } = await supabase
        .from("fotos")
        .select("id, url, descripcion, turno_id")
        .in("turno_id", ids)
        .order("created_at", { ascending: false });
      setFotos(f || []);
      setActual(0);
    } else {
      setFotos([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
    if (!turnoFoto) return setError("Elegí a qué visita pertenece la foto");
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
    return <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted)" }}>Cargando ficha...</main>;
  }

  const foto = fotos[actual];

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/clientes">‹</Link>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase">Diano</p>
            <p className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--muted)" }}>Barbershop</p>
          </div>
          <ThemeToggle />
        </header>

        <h1 className="text-[34px] font-semibold tracking-tight">{cliente.nombre}</h1>
        <p className="mb-6" style={{ color: "var(--muted)" }}>{cliente.telefono}</p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {ok && <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{ok}</p>}

        <section className="rounded-2xl p-4 mb-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <h2 className="font-medium mb-3">Galería</h2>
          {fotos.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Todavía no hay fotos.</p>
          ) : (
            <>
              <div className="relative mb-3">
                <img src={foto.url} alt="" className="w-full h-72 object-cover rounded-2xl" />
                <button onClick={() => setActual(actual === 0 ? fotos.length - 1 : actual - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full" style={{ background: "#1d1d1f", color: "#fff" }}>‹</button>
                <button onClick={() => setActual(actual === fotos.length - 1 ? 0 : actual + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full" style={{ background: "#1d1d1f", color: "#fff" }}>›</button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {fotos.map((f, i) => (
                  <button key={f.id} onClick={() => setActual(i)}>
                    <img src={f.url} alt="" className="h-14 w-14 object-cover rounded-xl" style={{ border: i === actual ? "2px solid #1d1d1f" : "1px solid var(--line)" }} />
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 space-y-2">
            <select
              value={turnoFoto}
              onChange={(e) => setTurnoFoto(e.target.value)}
              className="w-full rounded-xl px-3 py-3"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }}
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
              className="text-sm"
            />
          </div>
        </section>

        <section className="rounded-2xl p-4 mb-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <h2 className="font-medium mb-3">Notas del corte</h2>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={4}
            placeholder="Fade, barba, preferencias..."
            className="w-full rounded-xl px-3 py-3 outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }}
          />
          <button onClick={guardarNotas} className="mt-3 w-full rounded-2xl py-3 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>
            Guardar notas
          </button>
        </section>

        <h2 className="font-medium mb-3">Qué se hizo</h2>
        {turnos.map((t) => (
          <div key={t.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{one(t.servicios)?.nombre || "Servicio"}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {new Date(t.fecha_hora).toLocaleString("es-UY")} · ${one(t.servicios)?.precio || 0}
            </p>
            <p className="text-xs uppercase mt-1" style={{ color: "var(--muted)" }}>{t.estado}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
