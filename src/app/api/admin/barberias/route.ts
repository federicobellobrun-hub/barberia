import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { nombre, slug, email, password, whatsapp } = await request.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }
    if (!nombre || !slug || !email || !password) {
      return NextResponse.json({ error: "Completá nombre, link, email y contraseña" }, { status: 400 });
    }

    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: shop, error: shopErr } = await admin
      .from("barberias")
      .insert({
        nombre,
        slug: String(slug).toLowerCase().replace(/[^a-z0-9-]/g, ""),
        whatsapp_pedidos: whatsapp || null,
      })
      .select("id, slug")
      .single();
    if (shopErr) return NextResponse.json({ error: shopErr.message }, { status: 400 });

    const { data: auth, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr || !auth.user) {
      await admin.from("barberias").delete().eq("id", shop.id);
      return NextResponse.json({ error: authErr?.message || "No se pudo crear el usuario" }, { status: 400 });
    }

    const { error: userErr } = await admin.from("usuarios").insert({
      auth_user_id: auth.user.id,
      barberia_id: shop.id,
      nombre,
      rol: "admin",
    });
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 });

    await admin.from("horario_semanal").insert([
      { barberia_id: shop.id, dia_semana: 1, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 2, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 3, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 4, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 5, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 6, hora_inicio: "09:00", hora_fin: "14:00", activo: true },
      { barberia_id: shop.id, dia_semana: 0, hora_inicio: "09:00", hora_fin: "13:00", activo: false },
    ]);

    return NextResponse.json({
      ok: true,
      slug: shop.slug,
      link: `https://barberia-murex.vercel.app/b/${shop.slug}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
