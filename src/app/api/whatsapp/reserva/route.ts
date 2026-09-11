import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

function horaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });
}

function fechaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleDateString("es-UY", { timeZone: "America/Montevideo" });
}

async function sendTemplate(to: string, name: string, params: string[]) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, motivo: "Falta token" };

  const esPrueba = name === "hello_world";
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: esPrueba
      ? { name: "hello_world", language: { code: "en_US" } }
      : {
          name,
          language: { code: "es_UY" },
          components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
        },
  };

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, motivo: data?.error?.message || JSON.stringify(data), plantilla: name, params };
  return { ok: true, to, plantilla: name };
}

export async function POST(req: Request) {
  const { turnoId, soloCliente } = await req.json();
  if (!turnoId) return NextResponse.json({ error: "Falta turnoId" }, { status: 400 });

  const supabase = admin();
  const { data: t, error } = await supabase
    .from("turnos")
    .select("id, fecha_hora, barberia_id, clientes(nombre, telefono), barberias(nombre, modo_whatsapp, whatsapp_pedidos)")
    .eq("id", turnoId)
    .maybeSingle();

  if (error || !t) return NextResponse.json({ error: error?.message || "Turno no encontrado" }, { status: 404 });

  const cliente = Array.isArray(t.clientes) ? t.clientes[0] : t.clientes;
  const shop = Array.isArray(t.barberias) ? t.barberias[0] : t.barberias;

  if (!shop || shop.modo_whatsapp !== "automatico") {
    return NextResponse.json({ ok: true, skipped: "manual", shop });
  }

  const fecha = fechaUy(t.fecha_hora);
  const hora = horaUy(t.fecha_hora);
  const local = shop.nombre || "la barbería";
  const telLocal = shop.whatsapp_pedidos
    ? waNumber(String(shop.whatsapp_pedidos)).replace(/^598/, "0")
    : "el local";
  const conf = process.env.WHATSAPP_TEMPLATE_CONFIRMACION || "reserva_confirmada";
  const aviso = process.env.WHATSAPP_TEMPLATE_AVISO_BARBERO || "aviso_barbero";

  const resultados = [];

  if (cliente?.telefono) {
    resultados.push({
      a: "cliente",
      ...(await sendTemplate(waNumber(cliente.telefono), conf, [
        cliente.nombre || "cliente",
        local,
        fecha,
        hora,
      ])),
    });
  }

  if (!soloCliente && shop.whatsapp_pedidos) {
    resultados.push({
      a: "barbero",
      ...(await sendTemplate(waNumber(shop.whatsapp_pedidos), aviso, [
        cliente?.nombre || "cliente",
        local,
        fecha,
        hora,
      ])),
    });
  }

  return NextResponse.json({ ok: true, shop, plantillas: { conf, aviso }, resultados });
}
