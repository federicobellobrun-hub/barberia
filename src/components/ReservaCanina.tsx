"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Shop = {
  id: string;
  nombre: string;
  modo_whatsapp?: string | null;
  canina_cupo_grande?: number;
  canina_horas_grande?: string;
  canina_duracion_grande?: number;
  canina_un_grande_por_dia?: boolean;
};
type Servicio = { id: string; nombre: string; precio: number; duracion_minutos: number };
type Mascota = { id: string; nombre: string; tamano: string; pelo: string; estado_pelo: string };

const HORAS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

function normHora(h: string) {
  return String(h || "").replace(".", ":").slice(0, 5);
}
function toMin(hhmm: string) {
  const [h, m] = normHora(hhmm).split(":").map(Number);
  return h * 60 + m;
}
function fromMin(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
function rango(inicio: string, minutos: number) {
  const out: string[] = [];
  const end = toMin(inicio) + Math.max(minutos, 30);
  for (let t = toMin(inicio); t < end; t += 30) out.push(fromMin(t));
  return out;
}

export default function ReservaCanina({ shop }: { shop: Shop }) {
  const supabase = createClient();
  const automatico = String(shop.modo_whatsapp || "") === "automatico";
  const cupoGrande = Math.max(1, Math.min(2, Number(shop.canina_cupo_grande || (shop.canina_un_grande_por_dia ? 1 : 2))));
  const duracionGrande = Number(shop.canina_duracion_grande || 120);
  const horasGrandeCfg = String(shop.canina_horas_grande || "09:00")
    .split(",")
    .map((h) => normHora(h.trim()))
    .filter(Boolean)
    .slice(0, cupoGrande);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [tel, setTel] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [nombreDueño, setNombreDueño] = useState("");
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaId, setMascotaId] = useState("");
  const [perro, setPerro] = useState({
    nombre: "", edad: "", raza: "", tamano: "mediano", pelo: "corto",
    estado_pelo: "bueno", temperamento: "", sociable: "si",
  });
  const [servicioId, setServicioId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [iniciosGrande, setIniciosGrande] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from("servicios").select("id, nombre, precio, duracion_minutos").eq("barberia_id", shop.id).eq("activo", true);
      setServicios((s as Servicio[]) || []);
    };
    void load();
  }, [shop.id, supabase]);

  const buscar = async () => {
    setMsg("");
    const { data: c } = await supabase.from("clientes").select("id, nombre").eq("barberia_id", shop.id).eq("telefono", tel).maybeSingle();
    if (!c) {
      setClienteId(null);
      setMascotas([]);
      setMsg("Cliente nuevo: completá dueño y perro.");
      return;
    }
    setClienteId(c.id);
    setNombreDueño(c.nombre);
    const { data: m } = await supabase.from("mascotas").select("id, nombre, tamano, pelo, estado_pelo").eq("cliente_id", c.id);
    setMascotas((m as Mascota[]) || []);
    if (m && m[0]) {
      setMascotaId(m[0].id);
      setPerro((p) => ({ ...p, nombre: m[0].nombre, tamano: m[0].tamano, pelo: m[0].pelo, estado_pelo: m[0].estado_pelo }));
    }
  };

  useEffect(() => {
    if (!fecha) return;
    const load = async () => {
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      const { data } = await supabase
        .from("turnos")
        .select("fecha_hora, duracion_minutos, mascotas(tamano)")
        .eq("barberia_id", shop.id)
        .gte("fecha_hora", desde)
        .lte("fecha_hora", hasta)
        .in("estado", ["pendiente", "confirmado", "realizado"]);
      const busy = new Set<string>();
      const grandes: string[] = [];
      (data || []).forEach((t: { fecha_hora: string; duracion_minutos?: number | null; mascotas?: { tamano: string } | { tamano: string }[] | null }) => {
        const h = normHora(new Date(t.fecha_hora).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" }));
        const pet = Array.isArray(t.mascotas) ? t.mascotas[0] : t.mascotas;
        const mins = pet?.tamano === "grande" ? duracionGrande : Number(t.duracion_minutos || 60);
        rango(h, mins).forEach((x) => busy.add(x));
        if (pet?.tamano === "grande") grandes.push(h);
      });
      setOcupados(Array.from(busy));
      setIniciosGrande(grandes);
      setHora("");
    };
    void load();
  }, [fecha, shop.id, supabase, duracionGrande]);

  const servicio = servicios.find((s) => s.id === servicioId);
  const horasOk = HORAS.filter((h) => {
    if (ocupados.includes(h)) return false;
    if (perro.tamano !== "grande") return true;
    if (!horasGrandeCfg.includes(h)) return false;
    if (iniciosGrande.includes(h)) return false;
    if (iniciosGrande.length >= cupoGrande) return false;
    return rango(h, duracionGrande).every((x) => !ocupados.includes(x) || x === h);
  });

  const confirmar = async () => {
    setMsg("");
    if (enviando) return;
    if (!tel || !nombreDueño || !perro.nombre || !servicio || !fecha || !hora) {
      setMsg("Faltan datos");
      return;
    }
    setEnviando(true);
    try {
      let cid = clienteId;
      if (!cid) {
        const { data: c, error } = await supabase.from("clientes").insert({ barberia_id: shop.id, nombre: nombreDueño, telefono: tel }).select("id").single();
        if (error || !c) throw new Error(error?.message || "No se pudo crear el cliente");
        cid = c.id;
      }
      let mid = mascotaId;
      if (!mid) {
        const { data: m, error } = await supabase.from("mascotas").insert({
          barberia_id: shop.id, cliente_id: cid, nombre: perro.nombre, edad: perro.edad, raza: perro.raza,
          tamano: perro.tamano, pelo: perro.pelo, estado_pelo: perro.estado_pelo, temperamento: perro.temperamento,
          sociable: perro.sociable === "si",
        }).select("id").single();
        if (error || !m) throw new Error(error?.message || "No se pudo guardar el perro");
        mid = m.id;
      } else {
        await supabase.from("mascotas").update({
          tamano: perro.tamano, pelo: perro.pelo, estado_pelo: perro.estado_pelo, temperamento: perro.temperamento,
        }).eq("id", mid);
      }
      const mins = perro.tamano === "grande" ? duracionGrande : servicio.duracion_minutos || 60;
      const { data: turno, error } = await supabase.from("turnos").insert({
        barberia_id: shop.id,
        cliente_id: cid,
        servicio_id: servicio.id,
        mascota_id: mid,
        fecha_hora: new Date(`${fecha}T${hora}:00-03:00`).toISOString(),
        duracion_minutos: mins,
        estado: automatico ? "confirmado" : "pendiente",
        cliente_nombre: nombreDueño,
      }).select("id").single();
      if (error || !turno) throw new Error(error?.message || "No se pudo reservar");
      void fetch("/api/whatsapp/reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoId: turno.id }),
      });
      setOk(automatico ? "Reserva confirmada" : "Pedido enviado. El local lo confirma en la agenda.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setEnviando(false);
    }
  };

  if (ok) {
    return (
      <div className="pt-8 text-center">
        <p className="text-xl" style={{ fontFamily: "Georgia, Times, serif" }}>{ok}</p>
        <p className="mt-4 text-sm">{servicio?.nombre} · {perro.nombre} · {fecha} {hora}</p>
        <p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>
          El valor final lo confirma el local al ver al perro.
          Si el tamaño, el largo o el estado del pelo no coinciden con lo declarado, el precio puede cambiar.
        </p>
        <button type="button" className="mt-6 underline" onClick={() => { setOk(""); window.location.href = "/"; }}>Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">WhatsApp
        <input className="mt-1 w-full rounded-xl px-3 py-2" value={tel} onChange={(e) => setTel(e.target.value)} />
      </label>
      <button onClick={() => void buscar()} className="rounded-full px-4 py-2 text-sm" style={{ border: "1px solid var(--line)" }}>Buscar cliente</button>
      <label className="block text-sm">Dueño
        <input className="mt-1 w-full rounded-xl px-3 py-2" value={nombreDueño} onChange={(e) => setNombreDueño(e.target.value)} />
      </label>
      {mascotas.length > 0 && (
        <select className="w-full rounded-xl px-3 py-2" value={mascotaId} onChange={(e) => setMascotaId(e.target.value)}>
          {mascotas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          <option value="">+ Otro perro</option>
        </select>
      )}
      {(!mascotaId || mascotas.length === 0) && (
        <div className="rounded-2xl p-3" style={{ border: "1px solid var(--line)" }}>
          <input className="mb-2 w-full rounded-xl px-3 py-2" placeholder="Nombre del perro" value={perro.nombre} onChange={(e) => setPerro({ ...perro, nombre: e.target.value })} />
          <input className="mb-2 w-full rounded-xl px-3 py-2" placeholder="Edad" value={perro.edad} onChange={(e) => setPerro({ ...perro, edad: e.target.value })} />
          <input className="mb-2 w-full rounded-xl px-3 py-2" placeholder="Raza" value={perro.raza} onChange={(e) => setPerro({ ...perro, raza: e.target.value })} />
          <select className="mb-2 w-full rounded-xl px-3 py-2" value={perro.tamano} onChange={(e) => setPerro({ ...perro, tamano: e.target.value })}>
            <option value="chico">Chico</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
          <select className="mb-2 w-full rounded-xl px-3 py-2" value={perro.pelo} onChange={(e) => setPerro({ ...perro, pelo: e.target.value })}>
            <option value="corto">Pelo corto</option>
            <option value="largo">Pelo largo</option>
          </select>
          <select className="mb-2 w-full rounded-xl px-3 py-2" value={perro.estado_pelo} onChange={(e) => setPerro({ ...perro, estado_pelo: e.target.value })}>
            <option value="bueno">Pelo en buen estado</option>
            <option value="nudos">Con nudos</option>
          </select>
          <input className="mb-2 w-full rounded-xl px-3 py-2" placeholder="Temperamento" value={perro.temperamento} onChange={(e) => setPerro({ ...perro, temperamento: e.target.value })} />
          <select className="w-full rounded-xl px-3 py-2" value={perro.sociable} onChange={(e) => setPerro({ ...perro, sociable: e.target.value })}>
            <option value="si">Se lleva con otros perros</option>
            <option value="no">No se lleva con otros</option>
          </select>
        </div>
      )}
      <select className="w-full rounded-xl px-3 py-2" value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
        <option value="">Servicio</option>
        {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>
      <input className="w-full rounded-xl px-3 py-2" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      {perro.tamano === "grande" && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Grande: {cupoGrande} por día · {horasGrandeCfg.join(" y ")} · {duracionGrande} min
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {horasOk.map((h) => (
          <button key={h} onClick={() => setHora(h)} className="rounded-full px-3 py-1.5 text-sm" style={{ background: hora === h ? "#1A1612" : "var(--card)", color: hora === h ? "#F6F1E8" : "inherit" }}>{h}</button>
        ))}
      </div>
      {fecha && horasOk.length === 0 && <p className="text-sm">No hay horario para este perro ese día.</p>}
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        El precio lo confirma el local al ver al perro. Si lo declarado no coincide (tamaño o estado del pelo), puede variar.
      </p>
      <button onClick={() => void confirmar()} disabled={enviando} className="w-full rounded-full py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8", opacity: enviando ? 0.5 : 1 }}>
        {enviando ? "Enviando..." : automatico ? "Confirmar reserva" : "Pedir reserva"}
      </button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
