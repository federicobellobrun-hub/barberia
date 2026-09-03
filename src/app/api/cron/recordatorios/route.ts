import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

async function enviarWhatsapp(to: string, nombre: string, fecha: string, hora: string, local: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const plantilla = process.env.WHATSAPP_TEMPLATE_RECORDATORIO || "recordatorio_turno";
  if (!token || !phoneId) return { ok: false, motivo: "Falta token de WhatsApp" };

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: plantilla,
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: nombre },
              { type: "text", text: fecha },
              { type: "text", text: hora },
              { type: "text", text: local },
            ],
          },
        ],
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, motivo: data?.error?.message || "Error WhatsApp" };
  return { ok: true };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (secret && header !== `Bearer ${secret}`) {
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
      .select("id, fecha_hora, recordatorio_enviado_at, clientes(nombre, telefono), barberias(nombre)")
      .gte("fecha_hora", desde)
      .lte("fecha_hora", hasta)
      .in("estado", ["pendiente", "confirmado"])
      .is("recordatorio_enviado_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const resultados = [];
    for (const t of turnos || []) {
      const cliente = Array.isArray(t.clientes) ? t.clientes[0] : t.clientes;
      const shop = Array.isArray(t.barberias) ? t.barberias[0] : t.barberias;
      if (!cliente?.telefono) {
        resultados.push({ id: t.id, ok: false, motivo: "Sin teléfono" });
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
      }
      resultados.push({ id: t.id, nombre: cliente.nombre, ...envio });
    }

    return NextResponse.json({ dia, total: resultados.length, resultados });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
