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
};
type Producto = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
  activo: boolean;
  stock: number;
  imagen_url: string | null;
};

export default function CatalogoPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sNombre, setSNombre] = useState("");
  const [sDuracion, setSDuracion] = useState("30");
  const [sPrecio, setSPrecio] = useState("");
  const [pNombre, setPNombre] = useState("");
  const [pPrecio, setPPrecio] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStock, setPStock] = useState("0");
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const [s, p] = await Promise.all([
      supabase.from("servicios").select("id, nombre, duracion_minutos, precio, activo, imagen_url").eq("barberia_id", id).order("orden"),
      supabase.from("productos").select("id, nombre, precio, descripcion, activo, stock, imagen_url").eq("barberia_id", id).order("nombre"),
    ]);
    if (s.error) setError(s.error.message);
    if (p.error) setError(p.error.message);
    setServicios(s.data || []);
    setProductos(p.data || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).single();
      if (!data?.barberia_id) return;
      setBarberiaId(data.barberia_id);
      await load(data.barberia_id);
    };
    init();
  }, [router]);

  const addServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("servicios").insert({
      barberia_id: barberiaId,
      nombre: sNombre,
      duracion_minutos: Number(sDuracion),
      precio: Number(sPrecio),
      activo: true,
      orden: servicios.length + 1,
    });
    if (error) return setError(error.message);
    setSNombre("");
    setSDuracion("30");
    setSPrecio("");
    await load(barberiaId);
  };

  const addProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("productos").insert({
      barberia_id: barberiaId,
      nombre: pNombre,
      precio: Number(pPrecio),
      descripcion: pDesc || null,
      stock: Number(pStock),
      activo: true,
    });
    if (error) return setError(error.message);
    setPNombre("");
    setPPrecio("");
    setPDesc("");
    setPStock("0");
    await load(barberiaId);
  };

  const updateServicio = async (s: Servicio) => {
    const supabase = createClient();
    const { error } = await supabase.from("servicios").update({
      nombre: s.nombre,
      duracion_minutos: s.duracion_minutos,
      precio: s.precio,
      activo: s.activo,
    }).eq("id", s.id);
    if (error) setError(error.message);
  };

  const updateProducto = async (p: Producto) => {
    const supabase = createClient();
    const { error } = await supabase.from("productos").update({
      nombre: p.nombre,
      precio: p.precio,
      descripcion: p.descripcion,
      stock: p.stock,
      activo: p.activo,
    }).eq("id", p.id);
    if (error) setError(error.message);
  };

  const subirFotoServicio = async (servicioId: string, file: File) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const path = `${barberiaId}/servicios/${servicioId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error } = await supabase.from("servicios").update({ imagen_url: data.publicUrl }).eq("id", servicioId);
    if (error) setError(error.message);
    else await load(barberiaId);
  };

  const subirFotoProducto = async (productoId: string, file: File) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const path = `${barberiaId}/productos/${productoId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error } = await supabase.from("productos").update({ imagen_url: data.publicUrl }).eq("id", productoId);
    if (error) setError(error.message);
    else await load(barberiaId);
  };

  const delServicio = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) setError(error.message);
    else await load(barberiaId);
  };

  const delProducto = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) setError(error.message);
    else await load(barberiaId);
  };

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard">‹</Link>} />

        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Catálogo</h1>
        <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Servicios, productos y fotos</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <h2 className="font-medium mb-3">Servicios</h2>
        <form onSubmit={addServicio} className="rounded-2xl p-4 mb-4 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input required value={sNombre} onChange={(e) => setSNombre(e.target.value)} placeholder="Nombre. Ej: Corte fade" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <div className="grid grid-cols-2 gap-2">
            <input required value={sDuracion} onChange={(e) => setSDuracion(e.target.value)} placeholder="Minutos" className="rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input required value={sPrecio} onChange={(e) => setSPrecio(e.target.value)} placeholder="Precio" className="rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          </div>
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>Agregar servicio</button>
        </form>

        {servicios.map((s) => (
          <div key={s.id} className="rounded-2xl p-4 mb-3 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {s.imagen_url && <img src={s.imagen_url} alt="" className="h-28 w-full object-cover rounded-xl" />}
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) subirFotoServicio(s.id, file);
            }} />
            <input value={s.nombre} onChange={(e) => setServicios((prev) => prev.map((x) => x.id === s.id ? { ...x, nombre: e.target.value } : x))} className="w-full rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={s.duracion_minutos} onChange={(e) => setServicios((prev) => prev.map((x) => x.id === s.id ? { ...x, duracion_minutos: Number(e.target.value) } : x))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
              <input type="number" value={s.precio} onChange={(e) => setServicios((prev) => prev.map((x) => x.id === s.id ? { ...x, precio: Number(e.target.value) } : x))} className="rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => updateServicio(s)} className="flex-1 rounded-xl py-2 text-sm" style={{ background: "#1c1712", color: "#f4efe6" }}>Guardar</button>
              <button type="button" onClick={() => delServicio(s.id)} className="px-4 rounded-xl text-sm text-red-500">Borrar</button>
            </div>
          </div>
        ))}

        <h2 className="font-medium mt-8 mb-3">Productos</h2>
        <form onSubmit={addProducto} className="rounded-2xl p-4 mb-4 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input required value={pNombre} onChange={(e) => setPNombre(e.target.value)} placeholder="Ej: Cera capilar" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input required value={pPrecio} onChange={(e) => setPPrecio(e.target.value)} placeholder="Precio" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Descripción" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <input value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="Stock" className="w-full rounded-xl px-3 py-3" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>Agregar producto</button>
        </form>

        {productos.map((p) => (
          <div key={p.id} className="rounded-2xl p-4 mb-3 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {p.imagen_url && <img src={p.imagen_url} alt="" className="h-32 w-full object-cover rounded-xl" />}
            <input value={p.nombre} onChange={(e) => setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, nombre: e.target.value } : x))} className="w-full rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input type="number" value={p.precio} onChange={(e) => setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, precio: Number(e.target.value) } : x))} className="w-full rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input type="number" value={p.stock ?? 0} onChange={(e) => setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, stock: Number(e.target.value) } : x))} className="w-full rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }} />
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) subirFotoProducto(p.id, file);
            }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => updateProducto(p)} className="flex-1 rounded-xl py-2 text-sm" style={{ background: "#1c1712", color: "#f4efe6" }}>Guardar</button>
              <button type="button" onClick={() => delProducto(p.id)} className="px-4 rounded-xl text-sm text-red-500">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
