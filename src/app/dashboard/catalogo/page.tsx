"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  categoria: string | null;
  imagen_url: string | null;
  senia: number | null;
  activo: boolean;
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
    const { data } = await supabase
      .from("servicios")
      .select("id, nombre, precio, duracion_minutos, categoria, imagen_url, senia, activo")
      .eq("barberia_id", id)
      .order("nombre");
    setItems((data as Servicio[]) || []);
  };

  useEffect(() => {
    const start = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: yo } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", u.user.id).maybeSingle();
      if (!yo?.barberia_id) return;
      setShopId(yo.barberia_id);
      await load(yo.barberia_id);
    };
    void start();
  }, []);

  const subir = async (file: File) => {
    const path = `${shopId}/servicio-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("fotos").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
  };

  const guardar = async () => {
    setError("");
    if (!form.nombre) return setError("Poné el nombre");
    try {
      const payload = {
        barberia_id: shopId,
        nombre: form.nombre,
        precio: Number(form.precio) || 0,
        duracion_minutos: Number(form.duracion) || 30,
        categoria: form.categoria || null,
        senia: form.senia ? Number(form.senia) : 0,
        imagen_url: form.imagen || null,
        activo: true,
      };
      if (editId) {
        const { error } = await supabase.from("servicios").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("servicios").insert(payload);
        if (error) throw error;
      }
      setForm(vacio);
      setEditId(null);
      await load(shopId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
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
        <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Categoría (Pestañas, Uñas…)" className="w-full rounded-xl px-3 py-2" style={{ border: "1px solid var(--line)" }} />
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
        {form.imagen && <img src={form.imagen} alt="" className="h-20 w-20 object-cover rounded-xl" />}
        <button onClick={() => void guardar()} className="w-full rounded-full py-3" style={{ background: "var(--text)", color: "var(--bg)" }}>
          {editId ? "Guardar cambios" : "Agregar servicio"}
        </button>
        {editId && (
          <button onClick={() => { setEditId(null); setForm(vacio); }} className="w-full text-sm underline">
            Cancelar edición
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
            {s.imagen_url && <img src={s.imagen_url} alt="" className="h-14 w-14 object-cover rounded-lg" />}
            <div className="flex-1">
              <p className="font-medium">{s.nombre}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                ${s.precio} · {s.duracion_minutos} min {s.categoria ? `· ${s.categoria}` : ""} {s.senia ? `· seña ${s.senia}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setEditId(s.id);
                setForm({
                  nombre: s.nombre,
                  precio: String(s.precio),
                  duracion: String(s.duracion_minutos),
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
