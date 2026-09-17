"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import { PACKS } from "@/lib/rubro";

function shopActual() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("shop");
  if (q) {
    localStorage.setItem("admin_shop", q);
    return q;
  }
  return localStorage.getItem("admin_shop");
}

function mesUy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" }).slice(0, 7);
}

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

type Ajustes = {
  whatsapp_cobranza: string | null;
  banco: string | null;
  titular: string | null;
  cuenta: string | null;
  moneda: string | null;
};

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
  const [mostrarResenas, setMostrarResenas] = useState(true);
  const [estilo, setEstilo] = useState("auto");
  const [plan, setPlan] = useState("");
  const [planHasta, setPlanHasta] = useState<string | null>(null);
  const [modoWa, setModoWa] = useState("manual");
  const [waMes, setWaMes] = useState<string | null>(null);
  const [waEnviados, setWaEnviados] = useState(0);
  const [logo, setLogo] = useState<string | null>(null);
  const [portada, setPortada] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [ok, setOk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const shopQ = shopActual() ? `?shop=${shopActual()}` : "";
  const usados = waMes === mesUy() ? waEnviados : 0;
  const diasPlan = planHasta ? Math.ceil((new Date(planHasta + "T12:00:00-03:00").getTime() - Date.now()) / 86400000) : null;
  const waCobranza = ajustes?.whatsapp_cobranza || "097344643";

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const slugShop = shopActual();
      const { data: u } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", user.id).maybeSingle();
      let barberiaId = u?.barberia_id as string | null;
      if (u?.rol === "superadmin" && slugShop) {
        const { data: shop } = await supabase.from("barberias").select("id").eq("slug", slugShop).maybeSingle();
        if (shop) barberiaId = shop.id;
      }
      if (!barberiaId) return setError("Este usuario no tiene local vinculado");
      const [{ data }, { data: aj }] = await Promise.all([
        supabase
          .from("barberias")
          .select("id, nombre, whatsapp_pedidos, mensaje_confirmacion, logo_url, slug, direccion, maps_url, portada_url, fidelizacion, datos_cuenta, mercado_pago_url, pedido_sena, estilo, mostrar_resenas, plan, plan_hasta, modo_whatsapp, wa_mes, wa_enviados")
          .eq("id", barberiaId)
          .maybeSingle(),
        supabase.from("reservo_ajustes").select("whatsapp_cobranza, banco, titular, cuenta, moneda").eq("id", 1).maybeSingle(),
      ]);
      if (!data) return setError("No se encontró la barbería");
      setAjustes(aj || null);
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
      setMostrarResenas(data.mostrar_resenas !== false);
      setEstilo(data.estilo || "auto");
      setPlan(data.plan || "");
      setPlanHasta(data.plan_hasta || null);
      setModoWa(data.modo_whatsapp || "manual");
      setWaMes(data.wa_mes || null);
      setWaEnviados(Number(data.wa_enviados || 0));
    };
    void load();
  }, [router]);

  const pagar = async (tipo: "manual" | "automatico") => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (!jwt) return setError("Sesión vencida");
    const shop = shopActual();
    const res = await fetch(`/api/billing/checkout${shop ? `?shop=${shop}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + jwt },
      body: JSON.stringify({ plan: tipo }),
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) return setError(json.error || "No se pudo iniciar el pago");
    window.location.href = json.url;
  };

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
        mostrar_resenas: mostrarResenas,
        estilo,
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
    const campoFoto = tipo === "logo" ? "logo_url" : "portada_url";
    const { error: e1 } = await supabase.from("barberias").update({ [campoFoto]: data.publicUrl }).eq("id", id);
    if (e1) setError(e1.message);
    else if (tipo === "logo") {
      setLogo(data.publicUrl);
      setOk("Logo actualizado");
    } else {
      setPortada(data.publicUrl);
      setOk("Portada actualizada");
    }
  };

  const campoCls = "w-full rounded-2xl px-4 py-3";
  const estiloInput = { background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href={`/dashboard/mas${shopQ}`}>‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Configuración</h1>
        {modoWa === "automatico" && (
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            WhatsApp este mes: {usados}
            {plan === "trial" ? " / 40" : ""}
          </p>
        )}

        <div className="rounded-2xl p-4 mb-6 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <p className="font-medium">Plan</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {plan === "trial" ? "Prueba de 7 días" : plan === "automatico" ? "Automático" : "Manual"}
            {planHasta ? ` · vence ${new Date(planHasta + "T12:00:00-03:00").toLocaleDateString("es-UY")}` : ""}
            {diasPlan !== null ? ` · ${Math.max(0, diasPlan)} días` : ""}
          </p>
          <button type="button" className="w-full rounded-2xl py-3 text-sm" style={{ border: "1px solid var(--line)" }} onClick={() => void pagar("manual")}>
            Activar manual con Mercado Pago
          </button>
          <button type="button" className="w-full rounded-2xl py-3 text-sm font-medium" style={{ background: "#1c1712", color: "#f4efe6" }} onClick={() => void pagar("automatico")}>
            Activar automático con Mercado Pago
          </button>
          <p className="text-sm pt-2" style={{ color: "var(--muted)" }}>
            O transferí y te habilitamos el mes a mano.
          </p>
          <p className="text-sm whitespace-pre-wrap">
            Banco {ajustes?.banco || "Itaú"}
            {"\n"}Titular: {ajustes?.titular || "Federico Bello"}
            {"\n"}Cuenta N° {ajustes?.cuenta || "4103259"}
            {"\n"}Moneda: {ajustes?.moneda || "UYU"}
          </p>
          <a
            href={`https://wa.me/${waNumber(waCobranza)}?text=${encodeURIComponent("Hola, transferí el plan de Reservo")}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center rounded-2xl py-3 text-sm"
            style={{ border: "1px solid var(--line)" }}
          >
            Avisar transferencia por WhatsApp
          </a>
        </div>

        <form onSubmit={guardar} className="space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {ok && <p className="text-sm">{ok}</p>}
          {logo && <img src={logo} alt="Logo" className="h-20 w-20 object-contain rounded-full mx-auto" />}
          <p className="text-sm">Logo</p>
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void subir(file, "logo"); }} />
          {portada && <img src={portada} alt="Portada" className="h-32 w-full object-cover rounded-2xl" />}
          <p className="text-sm">Foto de portada</p>
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void subir(file, "portada"); }} />
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del local" className={campoCls} style={estiloInput} />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp. Ej: 099123456" className={campoCls} style={estiloInput} />
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className={campoCls} style={estiloInput} />
          <input value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="Link de Google Maps" className={campoCls} style={estiloInput} />
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="enlace. Ej: vale-studio" className={campoCls} style={estiloInput} />
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje de confirmación" rows={4} className={campoCls} style={estiloInput} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={fidelizacion} onChange={(e) => setFidelizacion(e.target.checked)} />
            Cortesía cada 10 cortes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pedirSena} onChange={(e) => setPedirSena(e.target.checked)} />
            Pedir seña al reservar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mostrarResenas} onChange={(e) => setMostrarResenas(e.target.checked)} />
            Mostrar reseñas en la web
          </label>
          <textarea value={cuenta} onChange={(e) => setCuenta(e.target.value)} placeholder="Datos de cuenta bancaria" rows={3} className={campoCls} style={estiloInput} />
          <input value={mpUrl} onChange={(e) => setMpUrl(e.target.value)} placeholder="https://link.mercadopago.com.uy/velestudio" className={campoCls} style={estiloInput} />
          <p className="text-sm pt-2">Estilo visual</p>
          <select value={estilo} onChange={(e) => setEstilo(e.target.value)} className={campoCls} style={estiloInput}>
            {PACKS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icono} {p.nombre}
              </option>
            ))}
          </select>
          <button className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Guardar
          </button>
        </form>
      </div>
    </main>
  );
}
