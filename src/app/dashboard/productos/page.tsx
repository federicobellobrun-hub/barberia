"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Producto = { id: string; nombre: string; precio: number };

export default function ProductosPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Producto[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: yo } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", u.user.id).maybeSingle();
    if (!yo?.barberia_id) return;
    const { data } = await supabase.from("productos").select("id, nombre, precio").eq("barberia_id", yo.barberia_id).order("nombre");
    setItems((data as Producto[]) || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar este producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) setError(error.message);
    else setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      <h1 className="mb-4 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Productos</h1>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div>
              <p className="font-medium">{p.nombre}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>${p.precio}</p>
            </div>
            <button onClick={() => void borrar(p.id)} className="text-sm text-red-500">Borrar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
