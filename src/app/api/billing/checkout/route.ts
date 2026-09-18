import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: Request) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN" }, { status: 500 });

  const jwt = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { plan } = (await req.json()) as { plan?: string };
  if (plan !== "manual" && plan !== "automatico") {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const supabase = admin();
  const { data: userRes } = await supabase.auth.getUser(jwt);
  if (!userRes.user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

  const { data: yo } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", userRes.user.id).maybeSingle();
  let barberiaId = yo?.barberia_id as string | null;
  const slug = new URL(req.url).searchParams.get("shop");
  if (yo?.rol === "superadmin" && slug) {
    const { data: shopRow } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
    if (shopRow) barberiaId = shopRow.id;
  }
  if (!barberiaId) return NextResponse.json({ error: "Sin local" }, { status: 400 });

  const { data: shop } = await supabase.from("barberias").select("id, nombre, slug").eq("id", barberiaId).maybeSingle();
  if (!shop) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });

  const { data: aj } = await supabase.from("reservo_ajustes").select("precio_manual, precio_automatico").eq("id", 1).maybeSingle();
  const precio = plan === "automatico" ? Number(aj?.precio_automatico || 1490) : Number(aj?.precio_manual || 890);
  const titulo = plan === "automatico" ? "Reservo Apps · plan automático (1 mes)" : "Reservo Apps · plan manual (1 mes)";
  const origin = "https://reservoapps.com";

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ title: titulo, quantity: 1, currency_id: "UYU", unit_price: precio }],
      back_urls: {
        success: `${origin}/plan/ok?shop=${shop.slug}`,
        failure: `${origin}/plan/error?shop=${shop.slug}`,
        pending: `${origin}/plan/error?shop=${shop.slug}`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/billing/webhook`,
      external_reference: `${shop.id}:${plan}`,
      metadata: { barberia_id: shop.id, plan },
    }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data?.message || JSON.stringify(data) }, { status: 400 });
  return NextResponse.json({ url: data.init_point || data.sandbox_init_point });
}
