"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Servicio = { id: string; barberia_id: string; nombre: string; duracion_minutos: number };

export default function NuevoTurnoPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos").eq("activo", true);
      setServicios(data || []);
      if (data?.[0]) setServicioId(data[0].id);
    };
    load();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicio = servicios.find((s) => s.id === servicioId);
    if (!servicio) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("crear_reserva", {
      p_barberia_id: servicio.barberia_id,
      p_servicio_id: servicio.id,
      p_nombre: nombre.trim(),
      p_telefono: telefono.trim(),
      p_fecha_hora: new Date(`${fecha}T${hora}:00-03:00`).toISOString(),
      p_duracion_minutos: servicio.duracion_minutos,
    });
    if (error) setError(error.message);
    else setOk(true);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Nuevo turno</h1>
        {ok ? (
          <p>Turno cargado. <Link href="/dashboard">Ver agenda</Link></p>
        ) : (
          <form onSubmit={guardar} className="space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}>
              {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input type="time" required value={hora} onChange={(e) => setHora(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>Guardar turno</button>
          </form>
        )}
      </div>
    </main>
  );
}
