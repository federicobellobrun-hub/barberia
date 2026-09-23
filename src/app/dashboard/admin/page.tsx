"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Shop = {
  id: string;
  nombre: string;
  slug: string;
  plan: string | null;
  activo: boolean | null;
  rubro: string | null;
  trial_hasta: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rubro, setRubro] = useState("canina");
  const [plan, setPlan] = useState("trial");
  const [msg, setMsg] = useState("");
  const [link, setLink] = useState("");

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
    const { data } = await supabase.from("barberias").select("id, nombre, slug, plan, activo, rubro, trial_hasta").order("nombre");
    setShops((data as Shop[]) || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const api = async (body: Record<string, unknown>) => {
    setMsg("");
    const res = await fetch("/api/admin/locales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Error");
      return null;
    }
    return data;
  };

  const crear = async () => {
    const data = await api({ accion: "crear", nombre, slug, email, password, rubro, plan });
    if (!data) return;
    setMsg(`Creada. Login: ${email}`);
    setLink(data.link || "");
    setNombre("");
    setSlug("");
    setEmail("");
    setPassword("");
    void load();
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <Link href="/panel" className="text-sm">← Panel</Link>
      <h1 className="mt-3 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Locales</h1>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
      {link && <p className="mt-1 break-all text-sm">{link}</p>}

      <section className="mt-4 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="font-medium">Nueva agenda</p>
        <input className="mt-3 w-full rounded-xl px-3 py-2 text-sm" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input className="mt-2 w-full rounded-xl px-3 py-2 text-sm" placeholder="Link opcional" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className="mt-2 w-full rounded-xl px-3 py-2 text-sm" placeholder="Email del dueño" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-2 w-full rounded-xl px-3 py-2 text-sm" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select className="mt-2 w-full rounded-xl px-3 py-2 text-sm" value={rubro} onChange={(e) => setRubro(e.target.value)}>
          <option value="barberia">Barbería</option>
          <option value="cejas_unas">Pestañas / uñas</option>
          <option value="canina">Peluquería canina</option>
        </select>
        <select className="mt-2 w-full rounded-xl px-3 py-2 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="trial">Prueba 7 días</option>
          <option value="manual">Manual</option>
          <option value="automatico">Automático</option>
        </select>
        <button onClick={() => void crear()} className="mt-3 w-full rounded-full py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
          Crear y generar acceso
        </button>
      </section>

      <div className="mt-6 space-y-3">
        {shops.filter((s) => s.activo !== false).map((s) => (
          <article key={s.id} className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{s.nombre}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {s.slug} · {s.rubro} · {s.plan}
              {s.trial_hasta ? ` · hasta ${new Date(s.trial_hasta).toLocaleDateString("es-UY")}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-full px-3 py-1.5 text-xs"
                style={{ border: "1px solid var(--line)" }}
                onClick={async () => {
                  const d = await api({ accion: "plan", id: s.id, plan: "manual" });
                  if (d) {
                    setMsg(`${s.nombre} quedó manual`);
                    void load();
                  }
                }}
              >
                Manual
              </button>
              <button
                className="rounded-full px-3 py-1.5 text-xs"
                style={{ border: "1px solid var(--line)" }}
                onClick={async () => {
                  const d = await api({ accion: "plan", id: s.id, plan: "automatico" });
                  if (d) {
                    setMsg(`${s.nombre} quedó automático`);
                    void load();
                  }
                }}
              >
                Automático
              </button>
              <button
                className="rounded-full px-3 py-1.5 text-xs"
                style={{ background: "#1A1612", color: "#F6F1E8" }}
                onClick={async () => {
                  const d = await api({ accion: "activar", id: s.id, plan: s.plan === "automatico" ? "automatico" : "manual" });
                  if (d) {
                    setMsg(`${s.nombre}: mes activado`);
                    void load();
                  }
                }}
              >
                Activar 30 días
              </button>
              <button
                className="rounded-full px-3 py-1.5 text-xs"
                onClick={async () => {
                  if (!confirm(`¿Sacar ${s.nombre}?`)) return;
                  const d = await api({ accion: "borrar", id: s.id });
                  if (d) {
                    setMsg(`${s.nombre} sacada`);
                    void load();
                  }
                }}
              >
                Sacar
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
