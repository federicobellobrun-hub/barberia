"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Resena = {
  id: string;
  nombre: string | null;
  puntaje: number;
  comentario: string | null;
  visible: boolean;
  created_at: string;
  servicios: { nombre: string } | { nombre: string }[] | null;
};

function one<T>(v: T | T[] | null) {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export default function ResenasPage() {
  const [items, setItems] = useState<Resena[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async (barberiaId: string) => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("resenas")
      .select("id, nombre, puntaje, comentario, visible, created_at, servicios(nombre)")
      .eq("barberia_id", barberiaId)
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    setItems((data as Resena[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", user.id).maybeSingle();
      if (!data?.barberia_id) return setError("Este usuario no tiene local");
      await load(data.barberia_id);
    };
    void init();
  }, [router]);

  const toggle = async (r: Resena) => {
    const supabase = createClient();
    await supabase.from("resenas").update({ visible: !r.visible }).eq("id", r.id);
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, visible: !x.visible } : x)));
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href="/dashboard/mas">‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Reseñas</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Publicar u ocultar comentarios</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {items.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>Todavía no hay reseñas.</p>}
        {items.map((r) => {
          const serv = one(r.servicios);
          return (
            <div key={r.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)", opacity: r.visible ? 1 : 0.55 }}>
              <p className="font-medium">{"★".repeat(r.puntaje)}{"☆".repeat(5 - r.puntaje)}</p>
              <p className="text-sm mt-1">{r.nombre || "Cliente"}{serv?.nombre ? ` · ${serv.nombre}` : ""}</p>
              {r.comentario && <p className="text-sm mt-2">{r.comentario}</p>}
              <button type="button" onClick={() => void toggle(r)} className="mt-3 text-sm">
                {r.visible ? "Ocultar" : "Publicar"}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
