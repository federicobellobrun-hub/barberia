"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
type Fila = { id?: string; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean };
type Barbero = { id: string; nombre: string };
type Excepcion = { id: string; fecha: string; hora_inicio: string | null; hora_fin: string | null; cerrado: boolean };

function norm(v: string) {
  return String(v).slice(0, 5);
}

function shopActual() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("shop");
  if (q) {
    localStorage.setItem("admin_shop", q);
    return q;
  }
  return localStorage.getItem("admin_shop");
}

function fechasDelMes(mes: string, weekdays: number[]) {
  const [y, m] = mes.split("-").map(Number);
  const out: string[] = [];
  const last = new Date(y, m, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const date = new Date(y, m - 1, d);
    if (weekdays.includes(date.getDay())) {
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      out.push(`${y}-${mm}-${dd}`);
    }
  }
  return out;
}

export default function HorariosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [quien, setQuien] = useState("local");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [exs, setExs] = useState<Excepcion[]>([]);
  const [exMes, setExMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [exDias, setExDias] = useState<number[]>([]);
  const [exFecha, setExFecha] = useState("");
  const [exInicio, setExInicio] = useState("10:00");
  const [exFin, setExFin] = useState("14:00");
  const [exCerrado, setExCerrado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const router = useRouter();
  const shopQ = shopActual() ? `?shop=${shopActual()}` : "";

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

  const loadEx = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("horario_excepcion")
      .select("id, fecha, hora_inicio, hora_fin, cerrado")
      .eq("barberia_id", id)
      .order("fecha");
    if (error) setError(error.message);
    setExs((data as Excepcion[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const slug = shopActual();
      const { data } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", user.id).maybeSingle();
      let id = data?.barberia_id as string | null;
      if (data?.rol === "superadmin" && slug) {
        const { data: shop } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
        if (shop) id = shop.id;
      }
      if (!id) return;
      setBarberiaId(id);
      const { data: b } = await supabase.from("barberos").select("id, nombre").eq("barberia_id", id).eq("activo", true);
      setBarberos(b || []);
      await load(id, "local");
      await loadEx(id);
    };
    void init();
  }, [router]);

  const guardar = async () => {
    if (!barberiaId) return;
    const supabase = createClient();
    for (const f of filas) {
      const payload = { hora_inicio: f.hora_inicio, hora_fin: f.hora_fin, activo: f.activo };
      if (quien === "local") {
        if (f.id) {
          const { error } = await supabase.from("horario_semanal").update(payload).eq("id", f.id);
          if (error) return setError(error.message);
        } else {
          const { error } = await supabase.from("horario_semanal").insert({ ...payload, barberia_id: barberiaId, dia_semana: f.dia_semana });
          if (error) return setError(error.message);
        }
      } else if (f.id) {
        const { error } = await supabase.from("horario_barbero").update(payload).eq("id", f.id);
        if (error) return setError(error.message);
      } else {
        const { error } = await supabase.from("horario_barbero").insert({ ...payload, barberia_id: barberiaId, barbero_id: quien, dia_semana: f.dia_semana });
        if (error) return setError(error.message);
      }
    }
    setOk("Horario guardado");
    await load(barberiaId, quien);
  };

  const toggleDia = (n: number) => {
    setExDias((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const guardarEspecial = async () => {
    if (!barberiaId) return;
    const fechas = new Set<string>();
    if (exFecha) fechas.add(exFecha);
    fechasDelMes(exMes, exDias).forEach((f) => fechas.add(f));
    if (fechas.size === 0) return setError("Elegí una fecha o al menos un día del mes");
    const supabase = createClient();
    const rows = [...fechas].map((fecha) => ({
      barberia_id: barberiaId,
      fecha,
      hora_inicio: exCerrado ? null : exInicio,
      hora_fin: exCerrado ? null : exFin,
      cerrado: exCerrado,
    }));
    const { error } = await supabase.from("horario_excepcion").upsert(rows, { onConflict: "barberia_id,fecha" });
    if (error) return setError(error.message);
    setOk(`Guardado en ${rows.length} día${rows.length === 1 ? "" : "s"}`);
    setExFecha("");
    setExDias([]);
    await loadEx(barberiaId);
  };

  const borrarEx = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("horario_excepcion").delete().eq("id", id);
    if (error) setError(error.message);
    else await loadEx(barberiaId);
  };

  const campo = { background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href={`/dashboard/mas${shopQ}`}>‹</Link>} />
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
          style={campo}
        >
          <option value="local">Horario del local</option>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>

        {filas.map((f, i) => (
          <div key={f.dia_semana} className="rounded-2xl p-4 mb-3" style={campo}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{dias[f.dia_semana]}</p>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={f.activo} onChange={(e) => setFilas((prev) => prev.map((x, idx) => (idx === i ? { ...x, activo: e.target.checked } : x)))} />
                Abierto
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={f.hora_inicio} onChange={(e) => setFilas((prev) => prev.map((x, idx) => (idx === i ? { ...x, hora_inicio: e.target.value } : x)))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
              <input type="time" value={f.hora_fin} onChange={(e) => setFilas((prev) => prev.map((x, idx) => (idx === i ? { ...x, hora_fin: e.target.value } : x)))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            </div>
          </div>
        ))}

        <button onClick={() => void guardar()} className="w-full rounded-2xl py-4 font-medium mb-10" style={{ background: "#1c1712", color: "#f4efe6" }}>
          Guardar horario semanal
        </button>

        <h2 className="text-xl font-semibold mb-2">Horario especial</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Pisa el semanal. Un día suelto o todos los lunes de un mes.
        </p>

        <div className="rounded-2xl p-4 mb-4 space-y-3" style={campo}>
          <p className="text-sm">Un día</p>
          <input type="date" value={exFecha} onChange={(e) => setExFecha(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <p className="text-sm pt-2">O varios del mes</p>
          <input type="month" value={exMes} onChange={(e) => setExMes(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <div className="flex flex-wrap gap-2">
            {dias.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDia(i)}
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  background: exDias.includes(i) ? "#1c1712" : "var(--bg)",
                  color: exDias.includes(i) ? "#f4efe6" : "var(--text)",
                  border: "1px solid var(--line)",
                }}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={exCerrado} onChange={(e) => setExCerrado(e.target.checked)} />
            Cerrado esos días
          </label>
          {!exCerrado && (
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={exInicio} onChange={(e) => setExInicio(e.target.value)} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
              <input type="time" value={exFin} onChange={(e) => setExFin(e.target.value)} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            </div>
          )}
          <button type="button" onClick={() => void guardarEspecial()} className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Guardar horario especial
          </button>
        </div>

        {exs.map((e) => (
          <div key={e.id} className="rounded-2xl p-3 mb-2 flex items-center justify-between" style={campo}>
            <p className="text-sm">
              {e.fecha.slice(0, 10)} · {e.cerrado ? "Cerrado" : `${norm(e.hora_inicio || "")}–${norm(e.hora_fin || "")}`}
            </p>
            <button type="button" className="text-xs text-red-500" onClick={() => void borrarEx(e.id)}>
              Borrar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
