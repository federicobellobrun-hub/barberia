import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accion = String(body.accion || "crear");
    const sb = admin();

    if (accion === "borrar") {
      const id = body.id;
      if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
      const { data: users } = await sb.from("usuarios").select("id, auth_user_id, rol").eq("barberia_id", id);
      for (const u of users || []) {
        if (u.rol === "superadmin") continue;
        if (u.auth_user_id) await sb.auth.admin.deleteUser(u.auth_user_id);
        await sb.from("usuarios").delete().eq("id", u.id);
      }
      const { error } = await sb
        .from("barberias")
        .update({ activo: false, slug: `borrada-${Date.now().toString().slice(-8)}` })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (accion === "plan") {
      const modo = body.plan === "automatico" ? "automatico" : "manual";
      const { error } = await sb
        .from("barberias")
        .update({ plan: body.plan, modo_whatsapp: modo })
        .eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (accion === "activar") {
      const hasta = new Date();
      hasta.setDate(hasta.getDate() + 30);
      const modo = body.plan === "automatico" ? "automatico" : "manual";
      const { error } = await sb
        .from("barberias")
        .update({
          activo: true,
          plan: body.plan || "manual",
          modo_whatsapp: modo,
          trial_hasta: hasta.toISOString(),
        })
        .eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, hasta: hasta.toISOString() });
    }

    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const rubro = String(body.rubro || "barberia");
    const plan = String(body.plan || "trial");
    const slug = slugify(body.slug || nombre);
    if (!nombre || !email || !password || password.length < 6) {
      return NextResponse.json({ error: "Nombre, email y contraseña (6+)" }, { status: 400 });
    }
    const { data: shop, error: e1 } = await sb
      .from("barberias")
      .insert({
        nombre,
        slug,
        rubro,
        plan,
        activo: true,
        modo_whatsapp: plan === "automatico" ? "automatico" : "manual",
      })
      .select("id, slug")
      .single();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });
    const { data: auth, error: e2 } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });
    const { error: e3 } = await sb.from("usuarios").insert({
      auth_user_id: auth.user.id,
      barberia_id: shop.id,
      email,
      nombre,
      rol: "owner",
    });
    if (e3) return NextResponse.json({ error: e3.message }, { status: 400 });
    return NextResponse.json({ ok: true, slug: shop.slug, email, link: `https://${shop.slug}.reservoapps.com` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
