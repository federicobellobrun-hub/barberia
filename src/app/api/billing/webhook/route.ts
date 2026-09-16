import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function activar(barberiaId: string, plan: string) {
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + 31);
  await admin()
    .from("barberias")
    .update({
      plan,
      modo_whatsapp: plan === "automatico" ? "automatico" : "manual",
      trial_hasta: null,
      activo: true,
      plan_hasta: hasta.toISOString().slice(0, 10),
    })
    .eq("id", barberiaId);
}

export async function POST(req: Request) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: true });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const type = String(body.type || body.topic || "");
  const data = body.data as { id?: string } | undefined;
  const id = data?.id || String(body.id || "");
  if (!id || (type && !String(type).includes("payment"))) {
    return NextResponse.json({ ok: true });
  }
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pago = await res.json();
  if (pago.status !== "approved") return NextResponse.json({ ok: true, status: pago.status });
  const ref = String(pago.external_reference || "");
  const [barberiaId, plan] = ref.split(":");
  if (!barberiaId || (plan !== "manual" && plan !== "automatico")) return NextResponse.json({ ok: true });
  await activar(barberiaId, plan);
  return NextResponse.json({ ok: true, activado: barberiaId });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
