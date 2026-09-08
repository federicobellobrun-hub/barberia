import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, motivo: data?.error?.message || JSON.stringify(data) };
  return { ok: true };
}

export async function POST(req: Request) {
  const { turnoId, tipo } = await req.json();
  if (!turnoId || !tipo) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const supabase = admin();
  const { data: t, error } = await supabase
    .from("turnos")
    .select("id, fecha_hora, clientes(nombre, telefono), barberias(nombre, modo_whatsapp)")
    .eq("id", turnoId)
    .maybeSingle();
  if (error || !t) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });

  const cliente = Array.isArray(t.clientes) ? t.clientes[0] : t.clientes;
  const shop = Array.isArray(t.barberias) ? t.barberias[0] : t.barberias;
  if (!shop || shop.modo_whatsapp !== "automatico") {
    return NextResponse.json({ ok: true, skipped: "manual" });
  }
  if (!cliente?.telefono) return NextResponse.json({ ok: true, skipped: "sin telefono" });

  const plantilla =
    tipo === "cancelado"
      ? process.env.WHATSAPP_TEMPLATE_CANCELADO || process.env.WHATSAPP_TEMPLATE_RECORDATORIO || "hello_world"
      : process.env.WHATSAPP_TEMPLATE_MOVIDO || process.env.WHATSAPP_TEMPLATE_RECORDATORIO || "hello_world";

  const envio = await sendTemplate(waNumber(cliente.telefono), plantilla, [
    cliente.nombre || "cliente",
    fechaUy(t.fecha_hora),
    horaUy(t.fecha_hora),
    shop.nombre || "la barbería",
  ]);

  return NextResponse.json({ ok: true, envio });
}
