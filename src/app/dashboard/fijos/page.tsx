"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Cliente = { id: string; nombre: string; telefono: string };
type Mascota = { id: string; cliente_id: string; nombre: string; tamano: string | null };
type Servicio = { id: string; nombre: string; duracion_minutos: number };

function normHora(h: string) {
  return String(h || "").replace(".", ":").slice(0, 5);
}

export default function FijosPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState("");
  const [auto, setAuto] = useState(false);
  const [cupo, setCupo] = useState(1);
  const [horasGrande, setHorasGrande] = useState<string[]>(["09:00"]);
  const [duracionGrande, setDuracionGrande] = useState(120);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [mascotaId, setMascotaId] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [perro, setPerro] = useState({ nombre: "", tamano: "mediano", pelo: "corto", estado_pelo: "bueno" });
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
      const { data: shop } = await supabase.from("barberias").select("modo_whatsapp, canina_cupo_grande, canina_horas_grande, canina_duracion_grande").eq("id", u.barberia_id).maybeSingle();
      setAuto(shop?.modo_whatsapp === "automatico");
      setCupo(Number(shop?.canina_cupo_grande || 1) === 2 ? 2 : 1);
      setHorasGrande(String(shop?.canina_horas_grande || "09:00").split(",").map((h: string) => normHora(h.trim())).filter(Boolean));
      setDuracionGrande(Number(shop?.canina_duracion_grande || 120));
      const { data: c } = await supabase.from("clientes").select("id, nombre, telefono").eq("barberia_id", u.barberia_id).order("nombre");
      setClientes((c as Cliente[]) || []);
      const { data: m } = await supabase.from("mascotas").select("id, cliente_id, nombre, tamano").eq("barberia_id", u.barberia_id);
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
    let mid = mascotaId;
    let tamano = mascotas.find((m) => m.id === mascotaId)?.tamano || "mediano";
    if (nuevo || !mid) {
      if (!perro.nombre) return setMsg("Poné el nombre del perro");
      const { data: m, error } = await supabase.from("mascotas").insert({
        barberia_id: shopId,
        cliente_id: clienteId,
        nombre: perro.nombre,
        tamano: perro.tamano,
        pelo: perro.pelo,
        estado_pelo: perro.estado_pelo,
        sociable: true,
      }).select("id, tamano").single();
      if (error || !m) return setMsg(error?.message || "No se pudo guardar el perro");
      mid = m.id;
      tamano = m.tamano;
    }
    const esGrande = tamano === "grande";
    if (esGrande && !horasGrande.includes(normHora(hora))) {
      return setMsg(`Perro grande: usá una de estas horas: ${horasGrande.join(", ")}`);
    }
    const n = Math.min(12, Math.max(1, Number(cantidad) || 1));
    const dias = Number(cada) === 7 ? 7 : 15;
    const filas = [];
    const saltados: string[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(`${inicio}T12:00:00-03:00`);
      d.setDate(d.getDate() + i * dias);
      const ymd = d.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
      const desde = new Date(`${ymd}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${ymd}T23:59:59-03:00`).toISOString();
      if (esGrande) {
        const { data: ya } = await supabase
          .from("turnos")
          .select("id, mascotas(tamano)")
          .eq("barberia_id", shopId)
          .gte("fecha_hora", desde)
          .lte("fecha_hora", hasta)
          .in("estado", ["pendiente", "confirmado", "realizado"]);
        const grandes = (ya || []).filter((t: { mascotas?: { tamano: string } | { tamano: string }[] | null }) => {
          const pet = Array.isArray(t.mascotas) ? t.mascotas[0] : t.mascotas;
          return pet?.tamano === "grande";
        }).length;
        if (grandes >= cupo) {
          saltados.push(ymd);
          continue;
        }
      }
      filas.push({
        barberia_id: shopId,
        cliente_id: clienteId,
        servicio_id: servicioId,
        mascota_id: mid,
        fecha_hora: new Date(`${ymd}T${normHora(hora)}:00-03:00`).toISOString(),
        duracion_minutos: esGrande ? duracionGrande : servicio?.duracion_minutos || 60,
        estado: auto ? "confirmado" : "pendiente",
        cliente_nombre: cliente?.nombre || "",
      });
    }
    if (!filas.length) return setMsg("Ningún día tenía cupo de perro grande.");
    const { error } = await supabase.from("turnos").insert(filas);
    if (error) return setMsg(error.message);
    setMsg(`Listo: ${filas.length} turnos.${saltados.length ? ` Sin cupo: ${saltados.join(", ")}` : ""}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-4">
      <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
      <h1 className="mb-3 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Turnos fijos</h1>
      <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>Para un cliente que viene cada semana o cada 15 días.</p>
      <div className="space-y-3">
        <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); setMascotaId(""); setNuevo(false); }} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
          <option value="">Cliente</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.telefono}</option>)}
        </select>
        {clienteId && (
          <select value={nuevo ? "nuevo" : mascotaId} onChange={(e) => { if (e.target.value === "nuevo") { setNuevo(true); setMascotaId(""); } else { setNuevo(false); setMascotaId(e.target.value); } }} className="w-full rounded-xl px-3 py-3" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
            <option value="">Elegí perro</option>
            {perros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            <option value="nuevo">+ Cargar perro</option>
          </select>
        )}
        {nuevo && (
          <div className="rounded-2xl p-3 space-y-2" style={{ border: "1px solid var(--line)" }}>
            <input className="w-full rounded-xl px-3 py-2" placeholder="Nombre del perro" value={perro.nombre} onChange={(e) => setPerro({ ...perro, nombre: e.target.value })} />
            <select className="w-full rounded-xl px-3 py-2" value={perro.tamano} onChange={(e) => setPerro({ ...perro, tamano: e.target.value })}>
              <option value="chico">Chico</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
            <select className="w-full rounded-xl px-3 py-2" value={perro.pelo} onChange={(e) => setPerro({ ...perro, pelo: e.target.value })}>
              <option value="corto">Pelo corto</option>
              <option value="largo">Pelo largo</option>
            </select>
            <select className="w-full rounded-xl px-3 py-2" value={perro.estado_pelo} onChange={(e) => setPerro({ ...perro, estado_pelo: e.target.value })}>
              <option value="bueno">Pelo en buen estado</option>
              <option value="nudos">Con nudos</option>
            </select>
          </div>
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
