"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Shop = { id: string; nombre: string; slug: string; plan: string | null; activo: boolean | null };
type Barbero = { id: string; nombre: string; barberia_id: string };

export default function LocalesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const { data: me } = await supabase.from("usuarios").select("rol").eq("auth_user_id", session.user.id).maybeSingle();
      if (me?.rol !== "superadmin") {
        router.replace("/dashboard");
        return;
      }
      const [{ data: s, error: e1 }, { data: b, error: e2 }] = await Promise.all([
        supabase.from("barberias").select("id, nombre, slug, plan, activo").order("nombre"),
        supabase.from("barberos").select("id, nombre, barberia_id").order("nombre"),
      ]);
      if (e1) setError(e1.message);
      if (e2) setError(e2.message);
      setShops((s as Shop[]) || []);
      setBarberos((b as Barbero[]) || []);
      setLoading(false);
    };
    void load();
  }, [router, supabase]);

  const porLocal = useMemo(() => {
    const map: Record<string, Barbero[]> = {};
    barberos.forEach((x) => {
      map[x.barberia_id] = map[x.barberia_id] || [];
      map[x.barberia_id].push(x);
    });
    return map;
  }, [barberos]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <p className="mb-4 text-sm">
        <Link href="/panel">← Panel</Link>
      </p>
      <h1 className="mb-1 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
        Locales y equipo
      </h1>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
        Cuántos profesionales cargó cada barbería.
      </p>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {loading && <p>Cargando...</p>}
      {shops.map((s) => {
        const team = porLocal[s.id] || [];
        return (
          <article key={s.id} className="mb-3 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{s.nombre}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {s.slug} · {s.plan || "—"} {s.activo === false ? "· inactiva" : ""}
                </p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs" style={{ background: team.length > 1 ? "#1A1612" : "#EFE8DC", color: team.length > 1 ? "#F6F1E8" : "#1A1612" }}>
                {team.length} {team.length === 1 ? "barbero" : "barberos"}
              </span>
            </div>
            {team.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                Todavía no agregaron profesionales.
              </p>
            ) : (
              <p className="mt-2 text-sm">{team.map((t) => t.nombre).join(" · ")}</p>
            )}
          </article>
        );
      })}
    </main>
  );
}
