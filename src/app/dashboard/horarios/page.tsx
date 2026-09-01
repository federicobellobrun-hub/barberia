"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
type Fila = { id?: string; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean };
type Barbero = { id: string; nombre: string };

function norm(v: string) {
  return String(v).slice(0, 5);
}

export default function HorariosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [quien, setQuien] = useState("local");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const router = useRouter();

  const vacias = (): Fila[] =>
    dias.map((_, i) => ({
      dia_semana: i,
      hora_inicio: "09:00",
      hora_fin: i === 6 ? "14:00" : "19:00",
      activo: i !== 0,
    }));

  const load = async (id: string, barberoId: string) => {
    const supabase = createClient();
    if (barberoId === "local") {
      const { data, error } = await supabase
        .from("horario_semanal")
        .select("id, dia_semana, hora_inicio, hora_fin, activo")
        .eq("barberia_id", id)
        .order("dia_semana");
      if (error) setError(error.message);
      setFilas(data?.length ? data.map((d) => ({ ...d, hora_inicio: norm(d.hora_inicio), hora_fin: norm(d.hora_fin) })) : vacias());
    } else {
      const { data, error } = await supabase
        .from("horario_barbero")
        .select("id, dia_semana, hora_inicio, hora_fin, activo")
        .eq("barbero_id", barberoId)
        .order("dia_semana");
      if (error) setError(error.message);
      setFilas(data?.length ? data.map((d) => ({ ...d, hora_inicio: norm(d.hora_inicio), hora_fin: norm(d.hora_fin) })) : vacias());
    }
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).single();
      if (!data?.barberia_id) return;
      setBarberiaId(data.barberia_id);
      const { data: b } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", data.barberia_id).eq("activo", true);
      setBarberos(b || []);
      await load(data.barberia_id, "local");
    };
    init();
  }, [router]);

  const guardar = async () => {
    if (!barberiaId) return;
    const supabase = createClient();
    for (const f of filas) {
      const payload = {
        hora_inicio: f.hora_inicio,
        hora_fin: f.hora_fin,
        activo: f.activo,
      };
      if (quien === "local") {
        if (f.id) {
          const { error } = await supabase.from("horario_semanal").update(payload).eq("id", f.id);
          if (error) return setError(error.message);
        } else {
          const { error } = await supabase.from("horario_semanal").insert({
            ...payload,
            barberia_id: barberiaId,
            dia_semana: f.dia_semana,
          });
          if (error) return setError(error.message);
        }
      } else if (f.id) {
        const { error } = await supabase.from("horario_barbero").update(payload).eq("id", f.id);
        if (error) return setError(error.message);
      } else {
        const { error } = await supabase.from("horario_barbero").insert({
          ...payload,
          barberia_id: barberiaId,
          barbero_id: quien,
          dia_semana: f.dia_semana,
        });
        if (error) return setError(error.message);
      }
    }
    setOk("Horario guardado");
    await load(barberiaId, quien);
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Horarios</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {ok && <p className="text-sm mb-3">{ok}</p>}

        <select
          value={quien}
          onChange={async (e) => {
            setQuien(e.target.value);
            setOk("");
            if (barberiaId) await load(barberiaId, e.target.value);
          }}
          className="w-full rounded-2xl px-4 py-3 mb-4"
          style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}
        >
          <option value="local">Horario del local</option>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>

        {filas.map((f, i) => (
          <div key={f.dia_semana} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{dias[f.dia_semana]}</p>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.activo}
                  onChange={(e) => setFilas((prev) => prev.map((x, idx) => idx === i ? { ...x, activo: e.target.checked } : x))}
                />
                Abierto
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={f.hora_inicio} onChange={(e) => setFilas((prev) => prev.map((x, idx) => idx === i ? { ...x, hora_inicio: e.target.value } : x))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
              <input type="time" value={f.hora_fin} onChange={(e) => setFilas((prev) => prev.map((x, idx) => idx === i ? { ...x, hora_fin: e.target.value } : x))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            </div>
          </div>
        ))}

        <button onClick={guardar} className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
          Guardar horario
        </button>
      </div>
    </main>
  );
}
