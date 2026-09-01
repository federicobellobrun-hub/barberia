"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = { id: string; barberia_id: string; nombre: string; duracion_minutos: number };
type Barbero = { id: string; nombre: string };

export default function NuevoTurnoPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicioId, setServicioId] = useState("");
  const [barberoId, setBarberoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [repetir, setRepetir] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const [{ data: s }, { data: b }] = await Promise.all([
        supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos").eq("activo", true),
        supabase.from("barberos").select("id, nombre").eq("activo", true).order("nombre"),
      ]);
      setServicios(s || []);
      setBarberos(b || []);
      if (s?.[0]) setServicioId(s[0].id);
      if (b?.[0]) setBarberoId(b[0].id);
    };
    load();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicio = servicios.find((s) => s.id === servicioId);
    if (!servicio) return;
    const supabase = createClient();
    const veces = repetir ? 4 : 1;
    for (let i = 0; i < veces; i++) {
      const d = new Date(`${fecha}T${hora}:00-03:00`);
      d.setDate(d.getDate() + 7 * i);
      const { error } = await supabase.rpc("crear_reserva", {
        p_barberia_id: servicio.barberia_id,
        p_servicio_id: servicio.id,
        p_nombre: nombre.trim(),
        p_telefono: telefono.trim(),
        p_fecha_hora: d.toISOString(),
        p_duracion_minutos: servicio.duracion_minutos,
        p_barbero_id: barberoId || null,
      });
      if (error) {
        setError(error.message);
        return;
      }
    }
    setOk(true);
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Nuevo turno</h1>
        {ok ? (
          <p>Turno cargado. <Link href="/dashboard">Ver agenda</Link></p>
        ) : (
          <form onSubmit={guardar} className="space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}>
              {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {barberos.length > 0 && (
              <select value={barberoId} onChange={(e) => setBarberoId(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}>
                {barberos.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            )}
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input type="time" required value={hora} onChange={(e) => setHora(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} />
              Repetir las próximas 4 semanas
            </label>
            <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>Guardar turno</button>
          </form>
        )}
      </div>
    </main>
  );
}
