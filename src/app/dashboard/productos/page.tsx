"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
  stock: number;
  imagen_url: string | null;
};

export default function ProductosPage() {
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [desc, setDesc] = useState("");
  const [stock, setStock] = useState("0");
  const router = useRouter();

  const load = async (id: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("productos")
      .select("id, nombre, precio, descripcion, stock, imagen_url")
      .eq("barberia_id", id)
      .order("nombre");
    if (e) setError(e.message);
    setProductos(data || []);
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
      await load(data.barberia_id);
    };
    void init();
  }, [router]);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const supabase = createClient();
    const { error: e1 } = await supabase.from("productos").insert({
      barberia_id: barberiaId,
      nombre,
      precio: Number(precio),
      descripcion: desc || null,
      stock: Number(stock),
      activo: true,
    });
    if (e1) return setError(e1.message);
    setNombre("");
    setPrecio("");
    setDesc("");
    setStock("0");
    await load(barberiaId);
  };

  const guardar = async (p: Producto) => {
    const supabase = createClient();
    const { error: e1 } = await supabase
      .from("productos")
      .update({ nombre: p.nombre, precio: p.precio, descripcion: p.descripcion, stock: p.stock })
      .eq("id", p.id);
    if (e1) setError(e1.message);
  };

  const borrar = async (id: string) => {
    if (!barberiaId) return;
    const supabase = createClient();
    await supabase.from("productos").delete().eq("id", id);
    await load(barberiaId);
  };

  const foto = async (id: string, file: File) => {
    if (!barberiaId) return;
    const supabase = createClient();
    const path = `${barberiaId}/productos/${id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
    if (upErr) return setError(upErr.message);
    const { data } = supabase.storage.from("fotos").getPublicUrl(path);
    await supabase.from("productos").update({ imagen_url: data.publicUrl }).eq("id", id);
    await load(barberiaId);
  };

  const campo = "w-full rounded-xl px-3 py-3";
  const estilo = { background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" };

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Productos</h1>
        <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>
          Solo artículos de la tienda · {productos.length} cargados
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={agregar} className="rounded-2xl p-4 mb-4 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del producto" className={campo} style={estilo} />
          <input required value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" className={campo} style={estilo} />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" className={campo} style={estilo} />
          <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" className={campo} style={estilo} />
          <button className="w-full rounded-2xl py-3 font-medium" style={{ background: "#1c1712", color: "#f4efe6" }}>
            Agregar producto a la tienda
          </button>
        </form>
        {productos.length === 0 && !error && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Todavía no hay productos en este local.</p>
        )}
        {productos.map((p) => (
          <div key={p.id} className="rounded-2xl p-4 mb-3 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {p.imagen_url && <img src={p.imagen_url} alt="" className="h-32 w-full object-cover rounded-xl" />}
            <input value={p.nombre} onChange={(e) => setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, nombre: e.target.value } : x)))} className={campo} style={estilo} />
            <input type="number" value={p.precio} onChange={(e) => setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, precio: Number(e.target.value) } : x)))} className={campo} style={estilo} />
            <input type="number" value={p.stock ?? 0} onChange={(e) => setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock: Number(e.target.value) } : x)))} className={campo} style={estilo} />
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void foto(p.id, file); }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => void guardar(p)} className="flex-1 rounded-xl py-2 text-sm" style={{ background: "#1c1712", color: "#f4efe6" }}>Guardar</button>
              <button type="button" onClick={() => void borrar(p.id)} className="px-4 rounded-xl text-sm text-red-500">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
