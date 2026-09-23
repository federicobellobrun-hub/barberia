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
  activo: boolean;
};

export default function CatalogoPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Servicio[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: yo } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", u.user.id).maybeSingle();
    if (!yo?.barberia_id) return;
    const { data } = await supabase.from("servicios").select("id, nombre, precio, duracion_minutos, categoria, activo").eq("barberia_id", yo.barberia_id).order("nombre");
    setItems((data as Servicio[]) || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar este servicio?")) return;
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) setError(error.message);
    else setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-4">
      <BrandHeader />
      <h1 className="mb-4 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>Servicios</h1>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div>
              <p className="font-medium">{s.nombre}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                ${s.precio} · {s.duracion_minutos} min {s.categoria ? `· ${s.categoria}` : ""}
              </p>
            </div>
            <button onClick={() => void borrar(s.id)} className="text-sm text-red-500">Borrar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
