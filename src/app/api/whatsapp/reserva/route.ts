import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LIMITE_TRIAL = 40;

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
  if (!res.ok) return { ok: false, motivo: data?.error?.message || JSON.stringify(data), plantilla: name, params };
  return { ok: true, to, plantilla: name };
}

export async function POST(req: Request) {
  const { turnoId, soloCliente } = await req.json();
  if (!turnoId) return NextResponse.json({ error: "Falta turnoId" }, { status: 400 });

  const supabase = admin();
  const { data: t, error } = await supabase
    .from("turnos")
    .select("id, fecha_hora, estado, barberia_id, cliente_id, cliente_nombre")
    .eq("id", turnoId)
    .maybeSingle();

  if (error || !t) return NextResponse.json({ error: error?.message || "Turno no encontrado" }, { status: 404 });

  const [{ data: shop }, { data: cliente }] = await Promise.all([
    supabase
      .from("barberias")
      .select("id, nombre, modo_whatsapp, whatsapp_pedidos, plan, wa_mes, wa_enviados")
      .eq("id", t.barberia_id)
      .maybeSingle(),
    t.cliente_id
      ? supabase.from("clientes").select("nombre, telefono").eq("id", t.cliente_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!shop || String(shop.modo_whatsapp || "") !== "automatico") {
    return NextResponse.json({
      ok: true,
      skipped: "manual",
      shop: { nombre: shop?.nombre || null, modo: shop?.modo_whatsapp || null },
    });
  }

  const mes = mesUy();
  const usados = shop.wa_mes === mes ? Number(shop.wa_enviados || 0) : 0;
  if (shop.plan === "trial" && usados >= LIMITE_TRIAL) {
    return NextResponse.json({ ok: true, skipped: "limite_trial", usados, limite: LIMITE_TRIAL });
  }

  const nombre = t.cliente_nombre || cliente?.nombre || "cliente";
  const fecha = fechaUy(t.fecha_hora);
  const hora = horaUy(t.fecha_hora);
  const local = shop.nombre || "la barbería";
  const telLocal = shop.whatsapp_pedidos ? waNumber(String(shop.whatsapp_pedidos)).replace(/^598/, "0") : "el local";
  const conf = process.env.WHATSAPP_TEMPLATE_CONFIRMACION || "reserva_confirmada_v2";
  const aviso = process.env.WHATSAPP_TEMPLATE_AVISO_BARBERO || "aviso_barbero";
  const pendiente = t.estado === "pendiente";

  const resultados = [];

  if (cliente?.telefono && !pendiente) {
    resultados.push({
      a: "cliente",
      ...(await sendTemplate(waNumber(cliente.telefono), conf, [nombre, fecha, hora, local, telLocal])),
    });
  }

  if (!soloCliente && shop.whatsapp_pedidos) {
    resultados.push({
      a: "barbero",
      ...(await sendTemplate(waNumber(shop.whatsapp_pedidos), aviso, [nombre, local, fecha, hora])),
    });
  }

  const okCount = resultados.filter((r) => r.ok).length;
  if (okCount > 0) {
    await supabase.from("barberias").update({ wa_mes: mes, wa_enviados: usados + okCount }).eq("id", shop.id);
  }

  return NextResponse.json({ ok: true, shop, pendiente, usados: usados + okCount, plantillas: { conf, aviso }, resultados });
}
