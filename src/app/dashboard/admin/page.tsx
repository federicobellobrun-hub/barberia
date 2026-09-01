"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Shop = { id: string; nombre: string; slug: string | null; activo: boolean | null };

export default function AdminPage() {
  const [okAdmin, setOkAdmin] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const router = useRouter();

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("barberias").select("id, nombre, slug, activo").order("nombre");
    setShops(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("rol").eq("auth_user_id", user.id).single();
      if (data?.rol !== "superadmin") {
        setError("Este panel es solo tuyo.");
        return;
      }
      setOkAdmin(true);
      await load();
    };
    init();
  }, [router]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk("");
    const res = await fetch("/api/admin/barberias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, slug, email, password, whatsapp }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "No se pudo crear");
    setOk(`Creada. Link: ${data.link}`);
    setNombre("");
    setSlug("");
    setEmail("");
    setPassword("");
    setWhatsapp("");
    await load();
  };

  const toggle = async (s: Shop) => {
    const res = await fetch("/api/admin/barberias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, activo: !s.activo }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "No se pudo actualizar");
    else await load();
  };

  const borrar = async (s: Shop) => {
    if (!confirm(`¿Borrar ${s.nombre}? Se borra el login también.`)) return;
    const res = await fetch("/api/admin/barberias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "No se pudo borrar");
    else await load();
  };

  if (!okAdmin) {
    return (
      <main className="min-h-screen px-6 py-20 text-center">
        <p>{error || "Cargando..."}</p>
        <Link href="/dashboard" className="inline-block mt-6">Volver</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Panel</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Crear, desactivar o borrar barberías</p>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {ok && <p className="text-sm mb-3">{ok}</p>}

        <form onSubmit={crear} className="rounded-2xl p-4 mb-8 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre. Ej: Barbería Juan" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input required value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="Link. Ej: juan" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email de acceso" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp del local" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>Crear barbería</button>
        </form>

        <h2 className="font-medium mb-3">Barberías</h2>
        {shops.map((s) => (
          <div key={s.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)", opacity: s.activo === false ? 0.55 : 1 }}>
            <p className="font-medium">{s.nombre}</p>
            <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>/b/{s.slug} · {s.activo === false ? "Inactiva" : "Activa"}</p>
            <div className="flex gap-3 text-sm">
              <a href={`/b/${s.slug}`}>Abrir</a>
              <button onClick={() => toggle(s)}>{s.activo === false ? "Activar" : "Desactivar"}</button>
              <button onClick={() => borrar(s)} className="text-red-500">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
