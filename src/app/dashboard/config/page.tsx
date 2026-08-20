"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default function ConfigPage() {
  const [id, setId] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).single();
      if (!u?.barberia_id) return;
      const { data } = await supabase.from("barberias").select("id, nombre, whatsapp_pedidos, mensaje_confirmacion").eq("id", u.barberia_id).single();
      if (data) {
        setId(data.id);
        setNombre(data.nombre || "");
        setWhatsapp(data.whatsapp_pedidos || "");
        setMensaje(data.mensaje_confirmacion || "");
      }
    };
    load();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("barberias").update({
      nombre,
      whatsapp_pedidos: whatsapp,
      mensaje_confirmacion: mensaje,
    }).eq("id", id);
    if (error) setError(error.message);
    else setOk("Guardado");
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-4">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard/mas">‹</Link>
          <ThemeToggle />
        </header>
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Configuración</h1>
        <form onSubmit={guardar} className="space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {ok && <p className="text-sm">{ok}</p>}
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la barbería" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp pedidos. Ej: 59897344643" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje de confirmación" rows={4} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1d1d1f", color: "#fff" }}>Guardar</button>
        </form>
      </div>
    </main>
  );
}
