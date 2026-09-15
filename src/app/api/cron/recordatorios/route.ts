import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LIMITE_TRIAL = 40;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function ymdUy(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}

function horaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });
}

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

function mesUy() {
  return ymdUy(new Date()).slice(0, 7);
}

async function enviarWhatsapp(to: string, nombre: string, fecha: string, hora: string, local: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const plantilla = process.env.WHATSAPP_TEMPLATE_RECORDATORIO || "recordatorio_cita";
  if (!token || !phoneId) return { ok: false, motivo: "Falta token de WhatsApp" };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: plantilla,
        language: { code: "es_UY" },
        components: [
          {
            type: "body",
            parameters: [nombre, fecha, hora, local].map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, motivo: data?.error?.message || JSON.stringify(data), plantilla };
  return { ok: true, plantilla };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  const okHeader = auth === `Bearer ${secret}`;
  const okQuery = url.searchParams.get("secret") === secret;
  if (!secret || (!okHeader && !okQuery)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = admin();
    const maniana = new Date();
    maniana.setDate(maniana.getDate() + 1);
    const dia = ymdUy(maniana);
    const desde = new Date(`${dia}T00:00:00-03:00`).toISOString();
    const hasta = new Date(`${dia}T23:59:59-03:00`).toISOString();
    const { data: turnos, error } = await supabase
      .from("turnos")
      .select("id, fecha_hora, recordatorio_enviado_at, clientes(nombre, telefono), barberias(id, nombre, plan, modo_whatsapp, wa_mes, wa_enviados)")
      .gte("fecha_hora", desde)
      .lte("fecha_hora", hasta)
      .eq("estado", "confirmado")
      .is("recordatorio_enviado_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const resultados = [];
    const mes = mesUy();

    for (const t of turnos || []) {
      const cliente = Array.isArray(t.clientes) ? t.clientes[0] : t.clientes;
      const shop = Array.isArray(t.barberias) ? t.barberias[0] : t.barberias;
      if (shop?.modo_whatsapp !== "automatico") {
        resultados.push({ id: t.id, ok: false, motivo: "manual" });
        continue;
      }
      if (!cliente?.telefono) {
        resultados.push({ id: t.id, ok: false, motivo: "Sin teléfono" });
        continue;
      }
      const usados = shop.wa_mes === mes ? Number(shop.wa_enviados || 0) : 0;
      if (shop.plan === "trial" && usados >= LIMITE_TRIAL) {
        resultados.push({ id: t.id, ok: false, motivo: "limite_trial" });
        continue;
      }
      const envio = await enviarWhatsapp(
        waNumber(cliente.telefono),
        cliente.nombre || "cliente",
        dia,
        horaUy(t.fecha_hora),
        shop?.nombre || "la barbería"
      );
      if (envio.ok) {
        await supabase.from("turnos").update({ recordatorio_enviado_at: new Date().toISOString() }).eq("id", t.id);
        await supabase.from("barberias").update({ wa_mes: mes, wa_enviados: usados + 1 }).eq("id", shop.id);
      }
      resultados.push({ id: t.id, nombre: cliente.nombre, ...envio });
    }

    return NextResponse.json({ dia, total: resultados.length, resultados });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
