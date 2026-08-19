import { NextResponse } from "next/server";

function normalizarTelefono(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (telefono.trim().startsWith("+")) return `whatsapp:${telefono.trim()}`;
  if (solo.startsWith("598")) return `whatsapp:+${solo}`;
  if (solo.startsWith("0")) return `whatsapp:+598${solo.slice(1)}`;
  return `whatsapp:+598${solo}`;
}

export async function POST(request: Request) {
  try {
    const { telefono, nombre, servicio, fecha, hora } = await request.json();

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!sid || !token || !from) {
      return NextResponse.json(
        { error: "Faltan variables de Twilio" },
        { status: 500 }
      );
    }

    if (!telefono) {
      return NextResponse.json({ error: "Falta el teléfono" }, { status: 400 });
    }

    const body = new URLSearchParams({
      From: from,
      To: normalizarTelefono(telefono),
      Body: `Hola ${nombre}, tu turno fue reservado.\n\nServicio: ${servicio}\nDía: ${fecha}\nHora: ${hora}\n\nTe esperamos.`,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Error Twilio" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
