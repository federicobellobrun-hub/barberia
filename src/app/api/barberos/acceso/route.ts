import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userClient = createClient(url, anon);
  const { data: userData } = await userClient.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(url, service);
  const { data: yo } = await admin
    .from("usuarios")
    .select("rol, barberia_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (!yo?.barberia_id || !["superadmin", "owner", "admin"].includes(yo.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const barberoId = String(body.barberoId || "");
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!barberoId || !email || password.length < 6) {
    return NextResponse.json({ error: "Barbero, email y contraseña (6+)" }, { status: 400 });
  }

  const { data: barbero } = await admin
    .from("barberos")
    .select("id, nombre, barberia_id")
    .eq("id", barberoId)
    .eq("barberia_id", yo.barberia_id)
    .maybeSingle();
  if (!barbero) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });

  const { data: created, error: e1 } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (e1 || !created.user) {
    return NextResponse.json({ error: e1?.message || "No se creó el usuario" }, { status: 500 });
  }

  const { error: e2 } = await admin.from("usuarios").insert({
    auth_user_id: created.user.id,
    barberia_id: barbero.barberia_id,
    barbero_id: barbero.id,
    nombre: barbero.nombre,
    email,
    rol: "barbero",
    activo: true,
  });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
