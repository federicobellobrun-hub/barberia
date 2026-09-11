"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Bloqueo = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  todo_el_dia: boolean | null;
};

export default function BloqueosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("bloqueos")
      .select("id, fecha_inicio, fecha_fin, motivo, todo_el_dia")
      .eq("barberia_id", id)
      .order("fecha_inicio", { ascending: false });
    if (e) setError(e.message);
    setBloqueos((data as Bloqueo[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!data?.barberia_id) return;
      setBarberiaId(data.barberia_id);
      await load(data.barberia_id);
    };
    void init();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId || !fechaInicio) return;
    const conHora = Boolean(horaInicio && horaFin);
    if ((horaInicio && !horaFin) || (!horaInicio && horaFin)) {
      setError("Completá hora desde y hasta, o dejá las dos vacías para el día entero.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const desde = conHora ? `${fechaInicio}T${horaInicio}:00-03:00` : `${fechaInicio}T00:00:00-03:00`;
    const hastaDia = fechaFin || fechaInicio;
    const hasta = conHora ? `${hastaDia}T${horaFin}:00-03:00` : `${hastaDia}T23:59:59-03:00`;
    const { error: e1 } = await supabase.from("bloqueos").insert({
      barberia_id: barberiaId,
      fecha_inicio: desde,
      fecha_fin: hasta,
      todo_el_dia: !conHora,
      motivo: motivo.trim() || (conHora ? "Horario bloqueado" : "Día bloqueado"),
    });
    setSaving(false);
    if (e1) return setError(e1.message);
    setFechaInicio("");
    setFechaFin("");
    setHoraInicio("");
    setHoraFin("");
    setMotivo("");
    await load(barberiaId);
  };

  const eliminar = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    await supabase.from("bloqueos").delete().eq("id", id);
    await load(barberiaId);
  };

  const box: React.CSSProperties = {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    background: "#EFE8DC",
    border: "1px solid #ddd4c8",
    color: "#1C1712",
    colorScheme: "light",
    fontSize: 16,
    height: 52,
    padding: "0 12px",
    display: "block",
  };

  return (
    <main className="min-h-screen pb-24" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="max-w-md mx-auto px-4 pt-4" style={{ overflowX: "hidden" }}>
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Bloqueos</h1>
        <p className="text-sm mb-5" style={{ color: "#7a7268" }}>
          Día entero o solo un rango de horas
        </p>

        <form
          onSubmit={guardar}
          className="rounded-2xl p-4 mb-6 space-y-3"
          style={{ background: "#fff", border: "1px solid #ddd4c8", overflow: "hidden" }}
        >
          {error && <p className="text-red-500 text-sm break-words">{error}</p>}

          <label className="block text-xs" style={{ color: "#7a7268" }}>
            Desde {fechaInicio ? `· ${fechaInicio}` : ""}
            <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={box} className="mt-1 rounded-xl" />
          </label>
          <label className="block text-xs" style={{ color: "#7a7268" }}>
            Hasta (opcional) {fechaFin ? `· ${fechaFin}` : ""}
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={box} className="mt-1 rounded-xl" />
          </label>
          <label className="block text-xs" style={{ color: "#7a7268" }}>
            Hora desde {horaInicio ? `· ${horaInicio}` : ""}
            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} style={box} className="mt-1 rounded-xl" />
          </label>
          <label className="block text-xs" style={{ color: "#7a7268" }}>
            Hora hasta {horaFin ? `· ${horaFin}` : ""}
            <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} style={box} className="mt-1 rounded-xl" />
          </label>

          <p className="text-xs" style={{ color: "#7a7268" }}>
            Sin horas = bloquea el día entero
          </p>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Feriado, almuerzo, vacaciones..."
            className="rounded-xl"
            style={{ ...box, height: 52 }}
          />
          <button disabled={saving} className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1C1712", color: "#F5F0E8" }}>
            {saving ? "Guardando..." : "Bloquear"}
          </button>
        </form>

        {bloqueos.map((b) => {
          const desde = new Date(b.fecha_inicio);
          const hasta = new Date(b.fecha_fin);
          const dia = desde.toLocaleDateString("es-UY");
          const rangoHora = b.todo_el_dia
            ? "Todo el día"
            : `${desde.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })} – ${hasta.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}`;
          return (
            <div key={b.id} className="rounded-2xl p-4 mb-3 flex justify-between gap-3" style={{ background: "#fff", border: "1px solid #ddd4c8" }}>
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{dia}</p>
                <p className="text-sm">{rangoHora}</p>
                <p className="text-sm break-words" style={{ color: "#7a7268" }}>
                  {b.motivo}
                </p>
              </div>
              <button type="button" onClick={() => void eliminar(b.id)} className="text-sm text-red-500 shrink-0">
                Quitar
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
