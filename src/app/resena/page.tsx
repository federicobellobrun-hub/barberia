"use client";

import { useEffect, useState, Suspense } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";
import { temaPack } from "@/lib/rubro";

function slugDeHost() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.replace(/^www\./, "");
  if (host === "reservoapps.com" || host === "localhost") return null;
  if (!host.endsWith(".reservoapps.com")) return null;
  return host.replace(/\.reservoapps\.com$/, "") || null;
}

function ResenaForm() {
  const search = useSearchParams();
  const slug = search.get("b") || slugDeHost() || (typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null) || "diano";
  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [servicios, setServicios] = useState<{ id: string; nombre: string }[]>([]);
  const [rubro, setRubro] = useState("barberia");
  const [estilo, setEstilo] = useState("auto");
  const [nombre, setNombre] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [puntaje, setPuntaje] = useState(5);
  const [comentario, setComentario] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = temaPack(estilo, rubro);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: shop } = await supabase.from("barberias").select("id, rubro, estilo").eq("slug", slug).maybeSingle();
      if (!shop) return setError("No se encontró el local");
      setBarberiaId(shop.id);
      setRubro(shop.rubro || "barberia");
      setEstilo(shop.estilo || "auto");
      const { data } = await supabase.from("servicios").select("id, nombre").eq("barberia_id", shop.id).eq("activo", true).order("orden");
      setServicios(data || []);
    };
    void load();
  }, [slug]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!barberiaId) return;
    const supabase = createClient();
    const { error: e1 } = await supabase.from("resenas").insert({
      barberia_id: barberiaId,
      servicio_id: servicioId || null,
      nombre: nombre.trim() || "Cliente",
      puntaje,
      comentario: comentario.trim() || null,
      visible: true,
    });
    if (e1) setError(e1.message);
    else setOk(true);
  };

  if (ok) {
    return (
      <main className="min-h-screen px-6 py-16 text-center" style={{ background: t.bg, color: t.text }}>
        <h1 className="text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>Gracias</h1>
        <Link href={`/b/${slug}`} className="inline-block mt-6">Volver</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-10" style={{ background: t.bg, color: t.text }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader />
        <h1 className="text-[34px] tracking-tight mb-6" style={{ fontFamily: "Georgia, Times, serif" }}>Dejá tu reseña</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={enviar} className="space-y-3">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full px-4 py-3 rounded-2xl" style={{ background: t.card, color: t.text }} />
          <select value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="w-full px-4 py-3 rounded-2xl" style={{ background: t.card, color: t.text }}>
            <option value="">Servicio (opcional)</option>
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setPuntaje(n)} className="text-2xl">
                {n <= puntaje ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Comentario" rows={4} className="w-full px-4 py-3 rounded-2xl" style={{ background: t.card, color: t.text }} />
          <button className="w-full py-4 font-medium rounded-2xl" style={{ background: t.btn, color: t.btnText }}>Enviar</button>
        </form>
      </div>
    </main>
  );
}

export default function ResenaPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center">Cargando...</main>}>
      <ResenaForm />
    </Suspense>
  );
}
