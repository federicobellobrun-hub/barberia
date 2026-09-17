"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Fila = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  fecha: string | null;
  created_at: string;
  servicios: { nombre: string } | { nombre: string }[] | null;
};

function shopActual() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("shop");
  if (q) {
    localStorage.setItem("admin_shop", q);
    return q;
  }
  return localStorage.getItem("admin_shop");
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

export default function EsperaPage() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const shopQ = shopActual() ? `?shop=${shopActual()}` : "";

  const load = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const slug = shopActual();
    const { data: u } = await supabase.from("usuarios").select("rol, barberia_id").eq("auth_user_id", user.id).maybeSingle();
    let barberiaId = u?.barberia_id as string | null;
    if (u?.rol === "superadmin" && slug) {
      const { data: shop } = await supabase.from("barberias").select("id").eq("slug", slug).maybeSingle();
      if (shop) barberiaId = shop.id;
    }
    if (!barberiaId) return;
    const { data, error } = await supabase
      .from("lista_espera")
      .select("id, nombre, telefono, fecha, created_at, servicios(nombre)")
      .eq("barberia_id", barberiaId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setFilas((data as Fila[]) || []);
  };

  useEffect(() => {
    void load();
  }, [router]);

  const avisar = (f: Fila) => {
    if (!f.telefono) return;
    const servicio = one(f.servicios)?.nombre || "un turno";
    const texto = `Hola ${f.nombre || ""}, se liberó un horario para ${servicio}${f.fecha ? ` el ${f.fecha}` : ""}. Reservá de nuevo en la web cuando puedas.`;
    window.open(`https://wa.me/${waNumber(f.telefono)}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const borrar = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("lista_espera").delete().eq("id", id);
    if (error) setError(error.message);
    else void load();
  };

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md mx-auto px-5 pt-5">
        <BrandHeader left={<Link href={`/dashboard/mas${shopQ}`}>‹</Link>} />
        <h1 className="text-[34px] font-semibold tracking-tight mb-5">Lista de espera</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {filas.length === 0 && <p style={{ color: "var(--muted)" }}>Nadie anotado.</p>}
        {filas.map((f) => (
          <div key={f.id} className="rounded-2xl p-4 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="font-medium">{f.nombre || "Cliente"}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {one(f.servicios)?.nombre || "Servicio"} · {f.fecha || "sin fecha"} · {f.telefono}
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <button type="button" onClick={() => avisar(f)}>
                Avisar WhatsApp
              </button>
              <button type="button" className="text-red-500" onClick={() => void borrar(f.id)}>
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
