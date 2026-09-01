"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

export default function ConfigPage() {
  const [id, setId] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [slug, setSlug] = useState("diano");
  const [direccion, setDireccion] = useState("");
  const [maps, setMaps] = useState("");
  const [fidelizacion, setFidelizacion] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [portada, setPortada] = useState<string | null>(null);
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
      const { data } = await supabase
        .from("barberias")
        .select("id, nombre, whatsapp_pedidos, mensaje_confirmacion, logo_url, slug, direccion, maps_url, portada_url, fidelizacion")
        .eq("id", u.barberia_id)
        .single();
      if (data) {
        setId(data.id);
        setNombre(data.nombre || "");
        setWhatsapp(data.whatsapp_pedidos || "");
        setMensaje(data.mensaje_confirmacion || "");
        setLogo(data.logo_url || null);
        setSlug(data.slug || "diano");
        setDireccion(data.direccion || "");
        setMaps(data.maps_url || "");
        setPortada(data.portada_url || null);
        setFidelizacion(data.fidelizacion !== false);
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
      slug: slug || "diano",
      direccion,
      maps_url: maps,
      fidelizacion,
    }).eq("id", id);
    if (error) setError(error.message);
    else setOk("Guardado");
  };

  const subir = async (file: File, tipo: "logo" | "portada") => {
    if (!id) return setError("No se encontró la barbería");
    const supabase = createClient();
    const path = `${id}/${tipo}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const campo = tipo === "logo" ? "logo_url" : "portada_url";
    const { error } = await supabase.from("barberias").update({ [campo]: data.publicUrl }).eq("id", id);
    if (error) setError(error.message);
    else if (tipo === "logo") {
      setLogo(data.publicUrl);
      setOk("Logo actualizado");
    } else {
      setPortada(data.publicUrl);
      setOk("Portada actualizada");
    }
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-6">Configuración</h1>
        <form onSubmit={guardar} className="space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {ok && <p className="text-sm">{ok}</p>}
          {logo && <img src={logo} alt="Logo" className="h-20 w-20 object-contain rounded-full mx-auto" />}
          <p className="text-sm">Logo</p>
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) subir(file, "logo"); }} />
          {portada && <img src={portada} alt="Portada" className="h-32 w-full object-cover rounded-2xl" />}
          <p className="text-sm">Foto de portada</p>
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) subir(file, "portada"); }} />
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la barbería" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp. Ej: 099123456" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="Link de Google Maps" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="link. Ej: diano" className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <p className="text-xs" style={{ color: "var(--muted)" }}>Link público: /b/{slug || "diano"}</p>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje de confirmación" rows={4} className="w-full rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={fidelizacion} onChange={(e) => setFidelizacion(e.target.checked)} />
            Cortesía cada 10 cortes
          </label>
          <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Guardar
          </button>
        </form>
      </div>
    </main>
  );
}
