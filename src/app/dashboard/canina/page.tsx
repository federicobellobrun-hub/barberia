"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import BrandHeader from "@/components/BrandHeader";

type Recargo = { id?: string; clave: string; etiqueta: string; monto: number; activo: boolean };

export default function CaninaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [shopId, setShopId] = useState("");
  const [manana, setManana] = useState(1);
  const [tarde, setTarde] = useState(1);
  const [unDia, setUnDia] = useState(false);
  const [recargos, setRecargos] = useState<Recargo[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const { data: me } = await supabase.from("usuarios").select("barberia_id").eq("auth_user_id", session.user.id).maybeSingle();
      if (!me?.barberia_id) return;
      setShopId(me.barberia_id);
      const { data: shop } = await supabase
        .from("barberias")
        .select("canina_cupo_grande_manana, canina_cupo_grande_tarde, canina_un_grande_por_dia")
        .eq("id", me.barberia_id)
        .maybeSingle();
      if (shop) {
        setManana(shop.canina_cupo_grande_manana ?? 1);
        setTarde(shop.canina_cupo_grande_tarde ?? 1);
        setUnDia(Boolean(shop.canina_un_grande_por_dia));
      }
      const { data: rec } = await supabase.from("recargos").select("*").eq("barberia_id", me.barberia_id);
      if (!rec || rec.length === 0) {
        const base = [
          { clave: "grande", etiqueta: "Perro grande", monto: 400, activo: true },
          { clave: "pelo_largo", etiqueta: "Pelo largo", monto: 300, activo: true },
          { clave: "nudos", etiqueta: "Pelo con nudos", monto: 300, activo: true },
        ];
        await supabase.from("recargos").insert(base.map((x) => ({ ...x, barberia_id: me.barberia_id })));
        setRecargos(base);
      } else setRecargos(rec as Recargo[]);
    };
    void load();
  }, [router, supabase]);

  const guardar = async () => {
    setMsg("");
    const { error: e1 } = await supabase
      .from("barberias")
      .update({
        canina_cupo_grande_manana: manana,
        canina_cupo_grande_tarde: tarde,
        canina_un_grande_por_dia: unDia,
      })
      .eq("id", shopId);
    if (e1) {
      setMsg(e1.message);
      return;
    }
    for (const r of recargos) {
      const { error } = await supabase.from("recargos").upsert({
        id: r.id,
        barberia_id: shopId,
        clave: r.clave,
        etiqueta: r.etiqueta,
        monto: Number(r.monto),
        activo: r.activo,
      });
      if (error) {
        setMsg(error.message);
        return;
      }
    }
    setMsg("Guardado");
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-10 pt-4">
      <BrandHeader left={<Link href="/dashboard/mas">←</Link>} />
      <h1 className="mb-4 text-xl">Peluquería canina</h1>
      <section className="mb-4 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="font-medium">Cupos perro grande</p>
        <label className="mt-3 block text-sm">
          Mañana
          <input className="mt-1 w-full rounded-xl px-3 py-2" type="number" value={manana} onChange={(e) => setManana(Number(e.target.value))} />
        </label>
        <label className="mt-3 block text-sm">
          Tarde
          <input className="mt-1 w-full rounded-xl px-3 py-2" type="number" value={tarde} onChange={(e) => setTarde(Number(e.target.value))} />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={unDia} onChange={(e) => setUnDia(e.target.checked)} />
          Un solo grande por día
        </label>
      </section>
      <section className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="font-medium">Recargos</p>
        {recargos.map((r, i) => (
          <div key={r.clave} className="mt-3">
            <p className="text-sm">{r.etiqueta}</p>
            <input
              className="mt-1 w-full rounded-xl px-3 py-2"
              type="number"
              value={r.monto}
              onChange={(e) => setRecargos((prev) => prev.map((x, idx) => (idx === i ? { ...x, monto: Number(e.target.value) } : x)))}
            />
          </div>
        ))}
      </section>
      <button onClick={() => void guardar()} className="mt-4 w-full rounded-full py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
        Guardar
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </main>
  );
}
