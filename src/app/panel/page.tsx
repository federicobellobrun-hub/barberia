"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Barberia = {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean | null;
  modo_whatsapp: string | null;
};

export default function PanelReservo() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [ok, setOk] = useState(false);
  const [vista, setVista] = useState<"apps" | "barberias">("apps");
  const [lista, setLista] = useState<Barberia[]>([]);
  const [msg, setMsg] = useState("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [modo, setModo] = useState("manual");

  async function init() {
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
    const { data } = await supabase
      .from("barberias")
      .select("id,nombre,slug,activo,modo_whatsapp")
      .order("nombre");
    setLista((data as Barberia[] | null) ?? []);
    setOk(true);
  }

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardar(id: string, patch: { activo?: boolean; modo_whatsapp?: string }) {
    setMsg("");
    const { error } = await supabase.from("barberias").update(patch).eq("id", id);
    if (error) setMsg(error.message);
    else void init();
  }

  async function crear(e: FormEvent<HTMLFormElement>) {
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
      setMsg("Ese enlace ya está en uso. Probá " + s + "-2");
      return;
    }
    const { error } = await supabase.from("barberias").insert({
      nombre: nombre.trim(),
      slug: s,
      activo: true,
      modo_whatsapp: modo,
    });
    if (error) {
      setMsg(error.message.includes("slug") ? "Ese enlace ya está en uso" : error.message);
      return;
    }
    setNombre("");
    setSlug("");
    setModo("manual");
    void init();
  }

  if (!ok) return <p className="p-6">Cargando…</p>;

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-8">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#7a7268]">Reservo Apps</p>
        <h1 className="mt-2 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Panel de control
        </h1>

        {vista === "apps" && (
          <>
            <p className="text-sm text-[#7a7268] mt-2 mb-8">Elegí el producto.</p>
            <button
              type="button"
              onClick={() => setVista("barberias")}
              className="w-full text-left rounded-2xl p-5 mb-3"
              style={{ border: "1px solid #ddd4c8", background: "#EFE8DC" }}
            >
              <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                Barberías
              </p>
              <p className="text-xs text-[#7a7268] mt-1">
                {lista.length} locales · demo Diano
              </p>
            </button>
            <div className="w-full rounded-2xl p-5" style={{ border: "1px solid #ddd4c8", opacity: 0.6 }}>
              <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                Uñas y pestañas
              </p>
              <p className="text-xs text-[#7a7268] mt-1">Próximamente</p>
            </div>
          </>
        )}

        {vista === "barberias" && (
          <>
            <button type="button" onClick={() => setVista("apps")} className="text-sm text-[#7a7268] mt-2 mb-6">
              ← Productos
            </button>

            {lista.map((b) => (
              <article key={b.id} className="rounded-2xl p-4 mb-3" style={{ border: "1px solid #ddd4c8" }}>
                <p className="font-medium">{b.nombre}</p>
                <p className="text-xs text-[#7a7268] mb-3">
                  /b/{b.slug}
                  {b.slug === "diano" ? " · Demo" : ""}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    className="rounded-full px-3 py-1 text-xs"
                    style={{
                      background: b.activo === false ? "#EFE8DC" : "#1C1712",
                      color: b.activo === false ? "#1C1712" : "#F5F0E8",
                    }}
                    onClick={() => void guardar(b.id, { activo: b.activo === false })}
                  >
                    {b.activo === false ? "Activar" : "Activa"}
                  </button>
                  <select
                    className="rounded-full px-3 py-1 text-xs bg-transparent"
                    style={{ border: "1px solid #ddd4c8" }}
                    value={b.modo_whatsapp || "manual"}
                    onChange={(e) => void guardar(b.id, { modo_whatsapp: e.target.value })}
                  >
                    <option value="manual">WhatsApp manual</option>
                    <option value="automatico">WhatsApp automático</option>
                  </select>
                </div>
                <div className="flex gap-4 text-xs">
                  {b.slug === "diano" ? (
                    <Link href="/dashboard">Entrar a la demo →</Link>
                  ) : (
                    <Link href={`/b/${b.slug}`}>Ver local público</Link>
                  )}
                  <Link href={`/b/${b.slug}`}>Abrir web</Link>
                </div>
              </article>
            ))}

            <form onSubmit={crear} className="mt-10 space-y-3">
              <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                Alta de barbería
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
                placeholder="enlace (valecejas)"
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
              <button type="submit" className="w-full rounded-full py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
                Crear barbería
              </button>
              {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
