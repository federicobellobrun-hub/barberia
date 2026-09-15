import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LIMITE_TRIAL = 40;

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

function mesUy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" }).slice(0, 7);
}

async function sendTemplate(to: string, name: string, params: string[]) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, motivo: "Falta token" };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
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
  const body = await req.json();
  const turnoId = String(body.turnoId || "").trim();
  const tipo = String(body.tipo || "").trim();
  if (!turnoId || !tipo) return NextResponse.json({ error: "Faltan datos", body }, { status: 400 });

  const supabase = admin();
  const { data: t, error } = await supabase
    .from("turnos")
    .select("id, fecha_hora, barberia_id, cliente_id")
    .eq("id", turnoId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message, turnoId }, { status: 400 });
  if (!t) return NextResponse.json({ error: "Turno no encontrado", turnoId }, { status: 404 });

  const [{ data: shop }, { data: cliente }] = await Promise.all([
    supabase.from("barberias").select("id, nombre, modo_whatsapp, plan, wa_mes, wa_enviados").eq("id", t.barberia_id).maybeSingle(),
    t.cliente_id ? supabase.from("clientes").select("nombre, telefono").eq("id", t.cliente_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (!shop || shop.modo_whatsapp !== "automatico") {
    return NextResponse.json({ ok: true, skipped: "manual", shop: shop?.nombre || null });
  }
  if (!cliente?.telefono) return NextResponse.json({ ok: true, skipped: "sin telefono" });

  const mes = mesUy();
  const usados = shop.wa_mes === mes ? Number(shop.wa_enviados || 0) : 0;
  if (shop.plan === "trial" && usados >= LIMITE_TRIAL) {
    return NextResponse.json({ ok: true, skipped: "limite_trial", usados });
  }

  const plantilla =
    tipo === "cancelado"
      ? process.env.WHATSAPP_TEMPLATE_CANCELADO || "reserva_cancelada"
      : process.env.WHATSAPP_TEMPLATE_MOVIDO || "reserva_movida";

  const envio = await sendTemplate(waNumber(cliente.telefono), plantilla, [
    cliente.nombre || "cliente",
    fechaUy(t.fecha_hora),
    horaUy(t.fecha_hora),
    shop.nombre || "la barbería",
  ]);

  if (envio.ok) {
    await supabase.from("barberias").update({ wa_mes: mes, wa_enviados: usados + 1 }).eq("id", shop.id);
  }

  return NextResponse.json({ ok: true, tipo, envio });
}
