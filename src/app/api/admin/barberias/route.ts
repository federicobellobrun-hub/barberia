import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const { nombre, slug, email, password, whatsapp } = await request.json();
    if (!nombre || !slug || !email || !password) {
      return NextResponse.json({ error: "Completá nombre, link, email y contraseña" }, { status: 400 });
    }
    const admin = adminClient();
    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "");

    const { data: shop, error: shopErr } = await admin
      .from("barberias")
      .insert({
        nombre,
        slug: cleanSlug,
        whatsapp_pedidos: whatsapp || null,
        activo: true,
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
      return NextResponse.json({ error: authErr?.message || "No se pudo crear el login" }, { status: 400 });
    }

    const { error: userErr } = await admin.from("usuarios").insert({
      auth_user_id: auth.user.id,
      barberia_id: shop.id,
      nombre,
      email,
      rol: "admin",
      activo: true,
    });
    if (userErr) {
      await admin.from("usuarios").delete().eq("barberia_id", shop.id);
      await admin.from("barberias").delete().eq("id", shop.id);
      return NextResponse.json({ error: userErr.message }, { status: 400 });
    }

    await admin.from("horario_semanal").insert([
      { barberia_id: shop.id, dia_semana: 1, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 2, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 3, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 4, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 5, hora_inicio: "09:00", hora_fin: "19:00", activo: true },
      { barberia_id: shop.id, dia_semana: 6, hora_inicio: "09:00", hora_fin: "14:00", activo: true },
      { barberia_id: shop.id, dia_semana: 0, hora_inicio: "09:00", hora_fin: "13:00", activo: false },
    ]);

    await admin.from("servicios").insert([
      { barberia_id: shop.id, nombre: "Corte", duracion_minutos: 30, precio: 400, activo: true, orden: 1 },
      { barberia_id: shop.id, nombre: "Barba", duracion_minutos: 20, precio: 250, activo: true, orden: 2 },
      { barberia_id: shop.id, nombre: "Corte y barba", duracion_minutos: 45, precio: 600, activo: true, orden: 3 },
    ]);

    return NextResponse.json({
      ok: true,
      slug: shop.slug,
      link: `https://barberia-murex.vercel.app/b/${shop.slug}`,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, activo } = await request.json();
    if (!id) return NextResponse.json({ error: "Falta la barbería" }, { status: 400 });
    const admin = adminClient();
    const { error } = await admin.from("barberias").update({ activo: !!activo }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Falta la barbería" }, { status: 400 });
    const admin = adminClient();

    const { data: shop } = await admin.from("barberias").select("slug").eq("id", id).single();
    if (shop?.slug === "diano") {
      return NextResponse.json({ error: "Diano no se puede borrar" }, { status: 400 });
    }

    const { data: users } = await admin.from("usuarios").select("auth_user_id").eq("barberia_id", id);
    await admin.from("horario_semanal").delete().eq("barberia_id", id);
    await admin.from("horario_barbero").delete().eq("barberia_id", id);
    await admin.from("usuarios").delete().eq("barberia_id", id);
    const { error } = await admin.from("barberias").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    for (const u of users || []) {
      if (u.auth_user_id) await admin.auth.admin.deleteUser(u.auth_user_id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
