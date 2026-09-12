"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Barberia = {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean | null;
  modo_whatsapp: string | null;
  rubro: string | null;
  plan: string | null;
  trial_hasta: string | null;
};

const RUBROS = [
  { id: "barberia", titulo: "Barberías", desc: "Cortes, barba y agenda clásica" },
  { id: "pestanas_unas", titulo: "Pestañas y uñas", desc: "Citas de estética y belleza" },
  { id: "canina", titulo: "Peluquería canina", desc: "Baño, corte y estética de mascotas" },
  { id: "taller", titulo: "Taller", desc: "Turnos de mecánica y service" },
  { id: "otro", titulo: "Otros", desc: "Cualquier otro local con agenda" },
] as const;

function etiquetaPlan(b: Barberia) {
  if (b.plan === "trial") {
    const vence = b.trial_hasta ? new Date(b.trial_hasta).toLocaleDateString("es-UY") : "";
    const vencida = b.trial_hasta ? new Date(b.trial_hasta) < new Date() : false;
    return vencida ? `Prueba vencida${vence ? " · " + vence : ""}` : `Prueba · vence ${vence}`;
  }
  if (b.plan === "automatico") return "Plan automático";
  return "Plan manual";
}

export default function PanelReservo() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [ok, setOk] = useState(false);
  const [rubroVista, setRubroVista] = useState<string | null>(null);
  const [lista, setLista] = useState<Barberia[]>([]);
  const [msg, setMsg] = useState("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState("manual");

  async function init() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/login";
      return;
    }
    const { data: yo } = await supabase.from("usuarios").select("rol").eq("auth_user_id", auth.user.id).maybeSingle();
    if (yo?.rol !== "superadmin") {
      window.location.href = "/dashboard";
      return;
    }
    const { data } = await supabase
      .from("barberias")
      .select("id,nombre,slug,activo,modo_whatsapp,rubro,plan,trial_hasta")
      .order("nombre");
    setLista((data as Barberia[] | null) ?? []);
    setOk(true);
  }

  useEffect(() => {
    void init();
  }, []);

  const visibles = useMemo(
    () => lista.filter((b) => (b.rubro || "barberia") === rubroVista),
    [lista, rubroVista]
  );

  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function guardar(id: string, patch: Record<string, string | boolean | null>) {
    setMsg("");
    const { error } = await supabase.from("barberias").update(patch).eq("id", id);
    if (error) setMsg(error.message);
    else void init();
  }

  async function pasarAPago(b: Barberia) {
    const plan = b.modo_whatsapp === "automatico" ? "automatico" : "manual";
    await guardar(b.id, { plan, trial_hasta: null });
  }

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const t = await token();
    if (!t) return setMsg("Sesión vencida");
    const res = await fetch("/api/admin/barberias", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({
        nombre,
        slug,
        email,
        password,
        modo_whatsapp: modo,
        rubro: rubroVista || "barberia",
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) return setMsg(json.error || "No se pudo crear");
    setNombre("");
    setSlug("");
    setEmail("");
    setPassword("");
    setModo("manual");
    void init();
  }

  async function borrar(id: string, shopSlug: string) {
    if (shopSlug === "diano") return;
    if (!window.confirm("¿Borrar esta agenda y su usuario?")) return;
    const t = await token();
    if (!t) return setMsg("Sesión vencida");
    const res = await fetch("/api/admin/barberias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ id }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) setMsg(json.error || "No se pudo borrar");
    else void init();
  }

  if (!ok) return <p className="p-6">Cargando…</p>;

  const rubroActual = RUBROS.find((r) => r.id === rubroVista);

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 py-8">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#7a7268]">Reservo Apps</p>
        <h1 className="mt-2 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Panel de control
        </h1>

        {!rubroVista && (
          <>
            <p className="text-sm text-[#7a7268] mt-2 mb-6">Elegí el tipo de agenda.</p>
            <Link
              href="/dashboard"
              className="mb-8 block rounded-2xl p-4 text-center text-sm"
              style={{ background: "#1C1712", color: "#F5F0E8" }}
            >
              Editar demo Diano →
            </Link>
            {RUBROS.map((r) => {
              const n = lista.filter((b) => (b.rubro || "barberia") === r.id).length;
              const trials = lista.filter((b) => (b.rubro || "barberia") === r.id && b.plan === "trial").length;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRubroVista(r.id)}
                  className="w-full text-left rounded-2xl p-5 mb-3"
                  style={{ border: "1px solid #ddd4c8", background: "#EFE8DC" }}
                >
                  <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                    {r.titulo}
                  </p>
                  <p className="text-xs text-[#7a7268] mt-1">
                    {r.desc} · {n} agenda{n === 1 ? "" : "s"}
                    {trials ? ` · ${trials} en prueba` : ""}
                  </p>
                </button>
              );
            })}
          </>
        )}

        {rubroVista && rubroActual && (
          <>
            <button type="button" onClick={() => setRubroVista(null)} className="text-sm text-[#7a7268] mt-2 mb-6">
              ← Tipos de agenda
            </button>
            <h2 className="text-2xl mb-4" style={{ fontFamily: "Georgia, Times, serif" }}>
              {rubroActual.titulo}
            </h2>

            {visibles.map((b) => (
              <article key={b.id} className="rounded-2xl p-4 mb-3" style={{ border: "1px solid #ddd4c8" }}>
                <p className="font-medium">{b.nombre}</p>
                <p className="text-xs text-[#7a7268] mb-1">
                  /b/{b.slug}
                  {b.slug === "diano" ? " · Demo" : ""}
                </p>
                <p className="text-xs mb-3" style={{ color: b.plan === "trial" ? "#8B3A3A" : "#7a7268" }}>
                  {etiquetaPlan(b)}
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
                  {b.plan === "trial" && (
                    <button
                      type="button"
                      className="rounded-full px-3 py-1 text-xs"
                      style={{ border: "1px solid #1C1712" }}
                      onClick={() => void pasarAPago(b)}
                    >
                      Pasar a pago
                    </button>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  <Link href={`/b/${b.slug}`}>Ver web</Link>
                  {b.slug === "diano" ? <Link href="/dashboard">Editar panel</Link> : null}
                  {b.slug !== "diano" ? (
                    <button type="button" className="text-red-700" onClick={() => void borrar(b.id, b.slug)}>
                      Borrar
                    </button>
                  ) : null}
                </div>
              </article>
            ))}

            <form onSubmit={crear} className="mt-10 space-y-3">
              <p className="text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
                Nueva agenda · {rubroActual.titulo}
              </p>
              <input className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Nombre del local" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <input className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="enlace (unas)" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <input type="email" className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Email del dueño" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Contraseña (mínimo 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} value={modo} onChange={(e) => setModo(e.target.value)}>
                <option value="manual">WhatsApp manual</option>
                <option value="automatico">WhatsApp automático</option>
              </select>
              <button type="submit" className="w-full rounded-full py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
                Crear agenda
              </button>
              {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
