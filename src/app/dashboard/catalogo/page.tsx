"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number | null;
  categoria: string | null;
  imagen_url: string | null;
  senia: number | null;
};

const vacio = { nombre: "", precio: "", duracion: "30", categoria: "", senia: "", imagen: "" };

export default function CatalogoPage() {
  const supabase = createClient();
  const [shopId, setShopId] = useState("");
  const [items, setItems] = useState<Servicio[]>([]);
  const [form, setForm] = useState(vacio);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async (id: string) => {
    const { data, error } = await supabase
      .from("servicios")
      .select("id, nombre, precio, duracion_minutos, categoria, imagen_url, senia")
      .eq("barberia_id", id)
      .order("nombre");
    if (error) setError(error.message);
    setItems((data as Servicio[]) || []);
  };

  useEffect(() => {
    const start = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setError("No hay sesión");
        return;
      }
      const { data: yo, error } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", u.user.id).maybeSingle();
      if (error) {
        setError(error.message);
        return;
      }
      if (!yo?.barberia_id) {
        setError("Este usuario no tiene barbería");
        return;
      }
      setShopId(yo.barberia_id);
      await load(yo.barberia_id);
    };
    void start();
  }, []);

  const subir = async (file: File) => {
    const path = `${shopId}/servicio-${Date.now()}`;
    const up = await supabase.storage.from("fotos").upload(path, file, { upsert: true });
    if (up.error) throw up.error;
    return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
  };

  const guardar = async () => {
    setError("");
    if (!shopId) return setError("Sin barbería");
    if (!form.nombre.trim()) return setError("Poné el nombre");
    const payload: Record<string, unknown> = {
      barberia_id: shopId,
      nombre: form.nombre.trim(),
      precio: Number(form.precio) || 0,
      duracion_minutos: Number(form.duracion) || 30,
      categoria: form.categoria.trim() || null,
      senia: form.senia ? Number(form.senia) : 0,
      imagen_url: form.imagen || null,
      activo: true,
    };
    const q = editId
      ? supabase.from("servicios").update(payload).eq("id", editId)
      : supabase.from("servicios").insert(payload);
    const { error } = await q;
    if (error) {
      setError(error.message);
      return;
    }
    setForm(vacio);
    setEditId(null);
    await load(shopId);
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar este servicio?")) return;
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) setError(error.message);
    else setItems((p) => p.filter((x) => x.id !== id));
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      <h1 className="mb-4 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Servicios</h1>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <div className="mb-6 space-y-2 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="w-full rounded-xl px-3 py-2" style={{ border: "1px solid var(--line)" }} />
        <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Categoría" className="w-full rounded-xl px-3 py-2" style={{ border: "1px solid var(--line)" }} />
        <div className="grid grid-cols-3 gap-2">
          <input value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Precio" className="rounded-xl px-3 py-2" style={{ border: "1px solid var(--line)" }} />
          <input value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} placeholder="Minutos" className="rounded-xl px-3 py-2" style={{ border: "1px solid var(--line)" }} />
          <input value={form.senia} onChange={(e) => setForm({ ...form, senia: e.target.value })} placeholder="Seña" className="rounded-xl px-3 py-2" style={{ border: "1px solid var(--line)" }} />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setForm({ ...form, imagen: await subir(file) });
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se subió la foto");
            }
          }}
        />
        {form.imagen && <img src={form.imagen} alt="" className="h-20 w-20 rounded-xl object-cover" />}
        <button onClick={() => void guardar()} className="w-full rounded-full py-3" style={{ background: "var(--text)", color: "var(--bg)" }}>
          {editId ? "Guardar cambios" : "Agregar servicio"}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
            {s.imagen_url && <img src={s.imagen_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
            <div className="flex-1">
              <p className="font-medium">{s.nombre}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                ${s.precio} · {s.duracion_minutos || 0} min {s.categoria ? `· ${s.categoria}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setEditId(s.id);
                setForm({
                  nombre: s.nombre,
                  precio: String(s.precio ?? ""),
                  duracion: String(s.duracion_minutos || 30),
                  categoria: s.categoria || "",
                  senia: s.senia ? String(s.senia) : "",
                  imagen: s.imagen_url || "",
                });
              }}
              className="text-sm"
            >
              Editar
            </button>
            <button onClick={() => void borrar(s.id)} className="text-sm text-red-500">Borrar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
