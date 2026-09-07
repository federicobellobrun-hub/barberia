import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !service || !anon) {
    return NextResponse.json({ error: "Faltan claves de servidor" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userClient = createClient(url, anon);
  const { data: userData } = await userClient.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(url, service);
  const { data: yo } = await admin
    .from("usuarios")
    .select("rol")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (yo?.rol !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const nombre = String(body.nombre || "").trim();
  const slug = slugify(String(body.slug || nombre));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const modo = body.modo_whatsapp === "automatico" ? "automatico" : "manual";

  if (!nombre || !slug || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Nombre, enlace, email y contraseña (6+)" },
      { status: 400 }
    );
  }

  const { data: existe } = await admin.from("barberias").select("id").eq("slug", slug).maybeSingle();
  if (existe) {
    return NextResponse.json({ error: "Ese enlace ya está en uso. Probá " + slug + "-2" }, { status: 409 });
  }

  const { data: barberia, error: e1 } = await admin
    .from("barberias")
    .insert({ nombre, slug, activo: true, modo_whatsapp: modo })
    .select("id")
    .single();
  if (e1 || !barberia) {
    return NextResponse.json({ error: e1?.message || "No se creó el local" }, { status: 500 });
  }

  const { data: created, error: e2 } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (e2 || !created.user) {
    await admin.from("barberias").delete().eq("id", barberia.id);
    return NextResponse.json({ error: e2?.message || "No se creó el usuario" }, { status: 500 });
  }

  const { error: e3 } = await admin.from("usuarios").insert({
    auth_user_id: created.user.id,
    barberia_id: barberia.id,
    nombre,
    email,
    rol: "owner",
    activo: true,
  });
  if (e3) {
    return NextResponse.json(
      { error: "Local creado, pero el perfil falló: " + e3.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, slug });
}
