"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
  imagen_url: string | null;
  categoria: string | null;
  sena: number | null;
};

export default function CatalogoPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [rubro, setRubro] = useState("barberia");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sNombre, setSNombre] = useState("");
  const [sCategoria, setSCategoria] = useState("");
  const [sDuracion, setSDuracion] = useState("30");
  const [sPrecio, setSPrecio] = useState("");
  const [sSena, setSSena] = useState("0");
  const router = useRouter();
  const rosa = rubro === "pestanas_unas";

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, activo, imagen_url, categoria, sena")
      .eq("barberia_id", id)
      .order("orden");
    if (e) setError(e.message);
    setServicios((data as Servicio[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!data?.barberia_id) return setError("Este usuario no tiene local");
      setBarberiaId(data.barberia_id);
      const { data: shop } = await supabase.from("barberias").select("rubro").eq("id", data.barberia_id).maybeSingle();
      setRubro(shop?.rubro || "barberia");
      await load(data.barberia_id);
    };
    void init();
  }, [router]);

  const addServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const supabase = createClient();
    const { error: e1 } = await supabase.from("servicios").insert({
      barberia_id: barberiaId,
      nombre: sNombre,
      categoria: sCategoria.trim() || null,
      duracion_minutos: Number(sDuracion),
      precio: Number(sPrecio),
      sena: Number(sSena) || 0,
      activo: true,
      orden: servicios.length + 1,
    });
    if (e1) return setError(e1.message);
    setSNombre("");
    setSCategoria("");
    setSDuracion("30");
    setSPrecio("");
    setSSena("0");
    await load(barberiaId);
  };

  const updateServicio = async (s: Servicio) => {
    const supabase = createClient();
    const { error: e1 } = await supabase
      .from("servicios")
      .update({
        nombre: s.nombre,
        categoria: s.categoria,
        duracion_minutos: s.duracion_minutos,
        precio: s.precio,
        sena: s.sena || 0,
        activo: s.activo,
      })
      .eq("id", s.id);
    if (e1) setError(e1.message);
  };

  const subirFotoServicio = async (servicioId: string, file: File) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const path = `${barberiaId}/servicios/${servicioId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error: e1 } = await supabase.from("servicios").update({ imagen_url: data.publicUrl }).eq("id", servicioId);
    if (e1) setError(e1.message);
    else await load(barberiaId);
  };

  const ocultarServicio = async (id: string, activo: boolean) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error: e1 } = await supabase.from("servicios").update({ activo }).eq("id", id);
    if (e1) setError(e1.message);
    else await load(barberiaId);
  };

  const campo = "w-full rounded-xl px-3 py-3";
  const estilo = { background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Catálogo</h1>
        <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
          Servicios, categorías y seña
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={addServicio} className="rounded-2xl p-4 mb-4 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input required value={sNombre} onChange={(e) => setSNombre(e.target.value)} placeholder={rosa ? "Nombre. Ej: Lifting" : "Nombre. Ej: Corte fade"} className={campo} style={estilo} />
          <input value={sCategoria} onChange={(e) => setSCategoria(e.target.value)} placeholder={rosa ? "Categoría. Ej: Pestañas" : "Categoría. Ej: Cortes"} className={campo} style={estilo} />
          <div className="grid grid-cols-3 gap-2">
            <input required value={sDuracion} onChange={(e) => setSDuracion(e.target.value)} placeholder="Min" className="rounded-xl px-3 py-3" style={estilo} />
            <input required value={sPrecio} onChange={(e) => setSPrecio(e.target.value)} placeholder="Precio" className="rounded-xl px-3 py-3" style={estilo} />
            <input value={sSena} onChange={(e) => setSSena(e.target.value)} placeholder="Seña" className="rounded-xl px-3 py-3" style={estilo} />
          </div>
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Agregar servicio
          </button>
        </form>

        {servicios.map((s) => (
          <div key={s.id} className="rounded-2xl p-4 mb-3 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)", opacity: s.activo ? 1 : 0.55 }}>
            {s.imagen_url && <img src={s.imagen_url} alt="" className="h-28 w-full object-cover rounded-xl" />}
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void subirFotoServicio(s.id, file); }} />
            <input value={s.nombre} onChange={(e) => setServicios((prev) => prev.map((x) => (x.id === s.id ? { ...x, nombre: e.target.value } : x)))} className={campo} style={estilo} />
            <input value={s.categoria || ""} onChange={(e) => setServicios((prev) => prev.map((x) => (x.id === s.id ? { ...x, categoria: e.target.value } : x)))} placeholder="Categoría" className={campo} style={estilo} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={s.duracion_minutos} onChange={(e) => setServicios((prev) => prev.map((x) => (x.id === s.id ? { ...x, duracion_minutos: Number(e.target.value) } : x)))} className="rounded-xl px-3 py-2" style={estilo} />
              <input type="number" value={s.precio} onChange={(e) => setServicios((prev) => prev.map((x) => (x.id === s.id ? { ...x, precio: Number(e.target.value) } : x)))} className="rounded-xl px-3 py-2" style={estilo} />
              <input type="number" value={s.sena || 0} onChange={(e) => setServicios((prev) => prev.map((x) => (x.id === s.id ? { ...x, sena: Number(e.target.value) } : x)))} className="rounded-xl px-3 py-2" style={estilo} />
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Minutos · Precio · Seña</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => void updateServicio(s)} className="flex-1 rounded-xl py-2 text-sm" style={{ background: "#1c1712", color: "#f4efe6" }}>Guardar</button>
              <button type="button" onClick={() => void ocultarServicio(s.id, !s.activo)} className="px-4 rounded-xl text-sm">{s.activo ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
