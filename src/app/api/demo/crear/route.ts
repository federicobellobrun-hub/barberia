import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RUBROS_OK = ["barberia", "pestanas_unas", "canina", "taller", "otro"];

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

async function avisoDemo(nombre: string, modo: string, vence: string, email: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_AVISO_DEMOS || "59897344643";
  const plantilla = process.env.WHATSAPP_TEMPLATE_AVISO_BARBERO || "aviso_barbero";
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
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
            parameters: [nombre, `demo ${modo}`, vence, email].map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const whatsapp = String(body.whatsapp || "").trim();
    const modo = body.modo === "automatico" ? "automatico" : "manual";
    const rubro = RUBROS_OK.includes(body.rubro) ? body.rubro : "barberia";
    const slug = slugify(String(body.slug || nombre));

    if (!nombre || !slug || !email || password.length < 6) {
      return NextResponse.json({ error: "Nombre, email y contraseña de 6+" }, { status: 400 });
    }

    const supabase = admin();
    const { data: existe } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
    if (existe) return NextResponse.json({ error: "Ese nombre de enlace ya está en uso. Probá otro." }, { status: 409 });

    const trialHasta = new Date();
    trialHasta.setDate(trialHasta.getDate() + 7);

    const { data: shop, error: e1 } = await supabase
      .from("barberias")
      .insert({
        nombre,
        slug,
        activo: true,
        modo_whatsapp: modo,
        rubro,
        whatsapp_pedidos: whatsapp || null,
        plan: "trial",
        trial_hasta: trialHasta.toISOString(),
        msgs_mes: 0,
      })
      .select("id")
      .single();
    if (e1 || !shop) return NextResponse.json({ error: e1?.message || "No se creó el local" }, { status: 500 });

    const { data: created, error: e2 } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (e2 || !created.user) {
      await supabase.from("barberias").delete().eq("id", shop.id);
      return NextResponse.json({ error: e2?.message || "No se creó el usuario" }, { status: 400 });
    }

    const { error: e3 } = await supabase.from("usuarios").insert({
      auth_user_id: created.user.id,
      barberia_id: shop.id,
      nombre,
      email,
      rol: "owner",
      activo: true,
    });
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

    const vence = trialHasta.toLocaleDateString("es-UY");
    await avisoDemo(nombre, modo, vence, email);

    return NextResponse.json({ ok: true, slug, vence });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
