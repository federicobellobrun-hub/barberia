"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = { id: string; barberia_id: string; nombre: string; duracion_minutos: number };
type Barbero = { id: string; nombre: string };

function shopActual() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("shop");
  if (q) {
    localStorage.setItem("admin_shop", q);
    return q;
  }
  return localStorage.getItem("admin_shop");
}

export default function NuevoTurnoPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicioId, setServicioId] = useState("");
  const [barberoId, setBarberoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [repetir, setRepetir] = useState(false);
  const [semanas, setSemanas] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [cuantos, setCuantos] = useState(1);
  const router = useRouter();
  const shopQ = shopActual() ? `?shop=${shopActual()}` : "";

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const slug = shopActual();
      const { data: u } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", user.id).maybeSingle();
      let id = u?.barberia_id as string | null;
      if (u?.rol === "superadmin" && slug) {
        const { data: shop } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
        if (shop) id = shop.id;
      }
      if (!id) return setError("Este usuario no tiene local vinculado");
      setBarberiaId(id);
      const [{ data: s, error: sErr }, { data: b, error: bErr }] = await Promise.all([
        supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos").eq("barberia_id", id).eq("activo", true),
        supabase.from("barberos").select("id, nombre").eq("barberia_id", id).eq("activo", true).order("nombre"),
      ]);
      if (sErr) setError(sErr.message);
      if (bErr) setError(bErr.message);
      setServicios(s || []);
      setBarberos(b || []);
      if (s?.[0]) setServicioId(s[0].id);
      if (b?.[0]) setBarberoId(b[0].id);
    };
    void load();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicio = servicios.find((s) => s.id === servicioId);
    if (!servicio || !barberiaId) return;
    const supabase = createClient();
    const veces = repetir ? Math.min(12, Math.max(2, Number(semanas) || 4)) : 1;
    for (let i = 0; i < veces; i++) {
      const d = new Date(`${fecha}T${hora}:00-03:00`);
      d.setDate(d.getDate() + 7 * i);
      const { error } = await supabase.rpc("crear_reserva", {
        p_barberia_id: barberiaId,
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
    setCuantos(veces);
    setOk(true);
  };

  const estilo = { background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href={`/dashboard/mas${shopQ}`}>‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Nuevo turno</h1>
        {ok ? (
          <p>
            {cuantos === 1 ? "Turno cargado." : `${cuantos} turnos cargados (cada semana).`}{" "}
            <Link href={`/dashboard${shopQ}`}>Ver agenda</Link>
          </p>
        ) : (
          <form onSubmit={guardar} className="space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={estilo}>
              {servicios.length === 0 && <option value="">Sin servicios</option>}
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            {barberos.length > 0 && (
              <select value={barberoId} onChange={(e) => setBarberoId(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={estilo}>
                {barberos.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            )}
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={estilo} />
            <input type="time" required value={hora} onChange={(e) => setHora(e.target.value)} className="w-full rounded-2xl px-4 py-3" style={estilo} />
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl px-4 py-3" style={estilo} />
            <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" className="w-full rounded-2xl px-4 py-3" style={estilo} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} />
              Turno fijo (repetir cada semana)
            </label>
            {repetir && (
              <input type="number" min={2} max={12} value={semanas} onChange={(e) => setSemanas(Number(e.target.value))} className="w-full rounded-2xl px-4 py-3" style={estilo} />
            )}
            <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
              {repetir ? `Guardar ${Math.min(12, Math.max(2, semanas))} turnos` : "Guardar turno"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
