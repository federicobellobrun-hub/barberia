"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Cliente = { id: string; nombre: string; telefono: string };
type Mascota = { id: string; cliente_id: string; nombre: string };
type Servicio = { id: string; nombre: string; duracion_minutos: number };

export default function FijosPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState("");
  const [auto, setAuto] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [mascotaId, setMascotaId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [inicio, setInicio] = useState("");
  const [hora, setHora] = useState("09:00");
  const [cada, setCada] = useState("15");
  const [cantidad, setCantidad] = useState("8");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!u?.barberia_id) return setMsg("Sin local");
      setShopId(u.barberia_id);
      const { data: shop } = await supabase.from("barberias").select("modo_whatsapp").eq("id", u.barberia_id).maybeSingle();
      setAuto(shop?.modo_whatsapp === "automatico");
      const { data: c } = await supabase.from("clientes").select("id, nombre, telefono").eq("barberia_id", u.barberia_id).order("nombre");
      setClientes((c as Cliente[]) || []);
      const { data: m } = await supabase.from("mascotas").select("id, cliente_id, nombre").eq("barberia_id", u.barberia_id);
      setMascotas((m as Mascota[]) || []);
      const { data: s } = await supabase.from("servicios").select("id, nombre, duracion_minutos").eq("barberia_id", u.barberia_id).eq("activo", true);
      setServicios((s as Servicio[]) || []);
    };
    void load();
  }, [router]);

  const perros = mascotas.filter((m) => m.cliente_id === clienteId);

  const crear = async () => {
    setMsg("");
    if (!shopId || !clienteId || !servicioId || !inicio || !hora) return setMsg("Completá cliente, servicio, día y hora");
    const supabase = createClient();
    const cliente = clientes.find((c) => c.id === clienteId);
    const servicio = servicios.find((s) => s.id === servicioId);
    const n = Math.min(12, Math.max(1, Number(cantidad) || 1));
    const dias = Number(cada) === 7 ? 7 : 15;
    const filas = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(`${inicio}T12:00:00-03:00`);
      d.setDate(d.getDate() + i * dias);
      const ymd = d.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
      filas.push({
        barberia_id: shopId,
        cliente_id: clienteId,
        servicio_id: servicioId,
        mascota_id: mascotaId || null,
        fecha_hora: new Date(`${ymd}T${hora}:00-03:00`).toISOString(),
        duracion_minutos: servicio?.duracion_minutos || 60,
        estado: auto ? "confirmado" : "pendiente",
        cliente_nombre: cliente?.nombre || "",
      });
    }
    const { error } = await supabase.from("turnos").insert(filas);
    setMsg(error ? error.message : `Listo: ${n} turnos cada ${dias} días. En automático el recordatorio sale el día anterior.`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-4">
      <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
      <h1 className="mb-3 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Turnos fijos</h1>
      <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>Para un cliente que viene cada semana o cada 15 días.</p>
      <div className="space-y-3">
        <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); setMascotaId(""); }} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
          <option value="">Cliente</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.telefono}</option>)}
        </select>
        {perros.length > 0 && (
          <select value={mascotaId} onChange={(e) => setMascotaId(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
            <option value="">Sin mascota</option>
            {perros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        )}
        <select value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
          <option value="">Servicio</option>
          {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }} />
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }} />
        <select value={cada} onChange={(e) => setCada(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
          <option value="7">Cada 7 días</option>
          <option value="15">Cada 15 días</option>
        </select>
        <select value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
          <option value="4">4 turnos</option>
          <option value="8">8 turnos</option>
          <option value="12">12 turnos</option>
        </select>
        <button onClick={() => void crear()} className="w-full rounded-full py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>Crear serie</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  );
}
