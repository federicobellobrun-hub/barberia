"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Barberia = {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean | null;
  modo_whatsapp: string | null;
};

export default function AdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [ok, setOk] = useState(false);
  const [lista, setLista] = useState<Barberia[]>([]);
  const [msg, setMsg] = useState("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [modo, setModo] = useState("manual");

  async function cargar() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/login";
      return;
    }
    const { data: yo } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("auth_user_id", auth.user.id)
      .maybeSingle();
    if (yo?.rol !== "superadmin") {
      window.location.href = "/dashboard";
      return;
    }
    setOk(true);
    const { data } = await supabase
      .from("barberias")
      .select("id,nombre,slug,activo,modo_whatsapp")
      .order("nombre");
    setLista((data as Barberia[]) || []);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar(b: Barberia, patch: Partial<Barberia>) {
    setMsg("");
    const { error } = await supabase.from("barberias").update(patch).eq("id", b.id);
    if (error) setMsg(error.message);
    else cargar();
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const s = slug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!nombre.trim() || !s) {
      setMsg("Nombre y enlace son obligatorios");
      return;
    }
    const { data: existe } = await supabase.from("barberias").select("id").eq("slug", s).maybeSingle();
    if (existe) {
      setMsg("Ese enlace ya está en uso. Probá otro, por ejemplo " + s + "-2");
      return;
    }
    const { error } = await supabase.from("barberias").insert({
      nombre: nombre.trim(),
      slug: s,
      activo: true,
      modo_whatsapp: modo,
    });
    if (error) {
      if (error.message.includes("barberias_slug_key")) {
        setMsg("Ese enlace ya está en uso");
      } else setMsg(error.message);
      return;
    }
    setNombre("");
    setSlug("");
    setModo("manual");
    cargar();
  }

  if (!ok) return <p className="p-6">Cargando…</p>;

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-8">
        <Link href="/dashboard" className="text-sm text-[#7a7268]">
          ← Panel
        </Link>
        <h1 className="mt-4 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Panel Reservo Apps
        </h1>
        <p className="text-sm text-[#7a7268] mb-8">Activá locales y el modo de WhatsApp.</p>

        {lista.map((b) => (
          <article key={b.id} className="rounded-2xl p-4 mb-3" style={{ border: "1px solid #ddd4c8" }}>
            <p className="font-medium">{b.nombre}</p>
            <p className="text-xs text-[#7a7268] mb-3">/b/{b.slug}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  background: b.activo === false ? "#EFE8DC" : "#1C1712",
                  color: b.activo === false ? "#1C1712" : "#F5F0E8",
                }}
                onClick={() => guardar(b, { activo: !(b.activo !== false) })}
              >
                {b.activo === false ? "Activar" : "Activa"}
              </button>
              <select
                className="rounded-full px-3 py-1 text-xs bg-transparent"
                style={{ border: "1px solid #ddd4c8" }}
                value={b.modo_whatsapp || "manual"}
                onChange={(e) => guardar(b, { modo_whatsapp: e.target.value })}
              >
                <option value="manual">WhatsApp manual</option>
                <option value="automatico">WhatsApp automático</option>
              </select>
            </div>
            <Link href={`/b/${b.slug}`} className="text-xs underline">
              Abrir local
            </Link>
          </article>
        ))}

        <form onSubmit={crear} className="mt-10 space-y-3">
          <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
            Nueva barbería
          </p>
          <input
            className="w-full rounded-xl px-3 py-3 bg-transparent"
            style={{ border: "1px solid #ddd4c8" }}
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="w-full rounded-xl px-3 py-3 bg-transparent"
            style={{ border: "1px solid #ddd4c8" }}
            placeholder="enlace (ej: valecejas)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <select
            className="w-full rounded-xl px-3 py-3 bg-transparent"
            style={{ border: "1px solid #ddd4c8" }}
            value={modo}
            onChange={(e) => setModo(e.target.value)}
          >
            <option value="manual">WhatsApp manual</option>
            <option value="automatico">WhatsApp automático</option>
          </select>
          <button className="w-full rounded-full py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
            Crear barbería
          </button>
          {msg && <p className="text-sm text-red-700">{msg}</p>}
        </form>
      </div>
    </main>
  );
}
