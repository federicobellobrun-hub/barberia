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
  const [slug, setSlug] = useState("");
  const [direccion, setDireccion] = useState("");
  const [maps, setMaps] = useState("");
  const [fidelizacion, setFidelizacion] = useState(true);
  const [cuenta, setCuenta] = useState("");
  const [mpUrl, setMpUrl] = useState("");
  const [pedirSena, setPedirSena] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [portada, setPortada] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: u } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!u?.barberia_id) {
        setError("Este usuario no tiene local vinculado");
        return;
      }
      const { data } = await supabase
        .from("barberias")
        .select("id, nombre, whatsapp_pedidos, mensaje_confirmacion, logo_url, slug, direccion, maps_url, portada_url, fidelizacion, datos_cuenta, mercado_pago_url, pedido_sena")
        .eq("id", u.barberia_id)
        .maybeSingle();
      if (!data) {
        setError("No se encontró la barbería");
        return;
      }
      setId(data.id);
      setNombre(data.nombre || "");
      setWhatsapp(data.whatsapp_pedidos || "");
      setMensaje(data.mensaje_confirmacion || "");
      setLogo(data.logo_url || null);
      setSlug(data.slug || "");
      setDireccion(data.direccion || "");
      setMaps(data.maps_url || "");
      setPortada(data.portada_url || null);
      setFidelizacion(data.fidelizacion !== false);
      setCuenta(data.datos_cuenta || "");
      setMpUrl(data.mercado_pago_url || "");
      setPedirSena(data.pedido_sena === true);
    };
    void load();
  }, [router]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return setError("No se encontró la barbería");
    const supabase = createClient();
    const { error: e1 } = await supabase
      .from("barberias")
      .update({
        nombre,
        whatsapp_pedidos: whatsapp,
        mensaje_confirmacion: mensaje,
        slug: slug || undefined,
        direccion,
        maps_url: maps,
        fidelizacion,
        datos_cuenta: cuenta,
        mercado_pago_url: mpUrl,
        pedido_sena: pedirSena,
      })
      .eq("id", id);
    if (e1) setError(e1.message);
    else setOk("Guardado");
  };

  const subir = async (file: File, tipo: "logo" | "portada") => {
    if (!id) return setError("No se encontró la barbería. Recargá la página.");
    const supabase = createClient();
    const path = `${id}/${tipo}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const campo = tipo === "logo" ? "logo_url" : "portada_url";
    const { error: e1 } = await supabase.from("barberias").update({ [campo]: data.publicUrl }).eq("id", id);
    if (e1) setError(e1.message);
    else if (tipo === "logo") {
      setLogo(data.publicUrl);
      setOk("Logo actualizado");
    } else {
      setPortada(data.publicUrl);
      setOk("Portada actualizada");
    }
  };

  const campo = "w-full rounded-2xl px-4 py-3";
  const estilo = { background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" };

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
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void subir(file, "logo"); }} />
          {portada && <img src={portada} alt="Portada" className="h-32 w-full object-cover rounded-2xl" />}
          <p className="text-sm">Foto de portada</p>
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void subir(file, "portada"); }} />
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del local" className={campo} style={estilo} />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp. Ej: 099123456" className={campo} style={estilo} />
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className={campo} style={estilo} />
          <input value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="Link de Google Maps" className={campo} style={estilo} />
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="enlace. Ej: vale-studio" className={campo} style={estilo} />
          <p className="text-xs" style={{ color: "var(--muted)" }}>Link público: /b/{slug || "..."}</p>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje de confirmación" rows={4} className={campo} style={estilo} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={fidelizacion} onChange={(e) => setFidelizacion(e.target.checked)} />
            Cortesía cada 10 cortes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pedirSena} onChange={(e) => setPedirSena(e.target.checked)} />
            Pedir seña al reservar
          </label>
          <textarea value={cuenta} onChange={(e) => setCuenta(e.target.value)} placeholder="Datos de cuenta bancaria" rows={3} className={campo} style={estilo} />
          <input value={mpUrl} onChange={(e) => setMpUrl(e.target.value)} placeholder="Link de Mercado Pago" className={campo} style={estilo} />
          <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Guardar
          </button>
        </form>
      </div>
    </main>
  );
}
