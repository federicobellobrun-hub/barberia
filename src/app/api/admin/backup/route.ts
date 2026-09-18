import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request) {
  const jwt = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const supabase = admin();
  const { data: userRes } = await supabase.auth.getUser(jwt);
  if (!userRes.user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  const { data: yo } = await supabase.from("usuarios").select("rol").eq("auth_user_id", userRes.user.id).maybeSingle();
  if (yo?.rol !== "superadmin") return NextResponse.json({ error: "Solo el dueño de Reservo" }, { status: 403 });

  const tablas = ["barberias", "usuarios", "servicios", "barberos", "productos", "horario_semanal", "horario_barbero", "horario_excepcion", "bloqueos", "reservo_ajustes"] as const;
  const out: Record<string, unknown> = { generado_at: new Date().toISOString() };
  for (const t of tablas) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) out[t] = { error: error.message };
    else out[t] = data;
  }
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservo-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
