"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function PanelPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState("");
  const [manual, setManual] = useState("890");
  const [auto, setAuto] = useState("1490");
  const [banco, setBanco] = useState("Banco Itaú");
  const [titular, setTitular] = useState("Federico Bello");
  const [cuenta, setCuenta] = useState("4103259");
  const [moneda, setMoneda] = useState("UYU");

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const { data: me } = await supabase.from("usuarios").select("rol").eq("auth_user_id", session.user.id).maybeSingle();
      if (me?.rol !== "superadmin") {
        router.replace("/dashboard");
        return;
      }
      const { data } = await supabase.from("reservo_ajustes").select("*").eq("id", 1).maybeSingle();
      if (data) {
        if (data.precio_manual) setManual(String(data.precio_manual));
        if (data.precio_automatico) setAuto(String(data.precio_automatico));
        if (data.banco_nombre) setBanco(data.banco_nombre);
        if (data.banco_titular) setTitular(data.banco_titular);
        if (data.banco_cuenta) setCuenta(data.banco_cuenta);
        if (data.banco_moneda) setMoneda(data.banco_moneda);
      }
      setOk(true);
    };
    void load();
  }, [router, supabase]);

  const guardar = async () => {
    setMsg("");
    const { error } = await supabase.from("reservo_ajustes").upsert({
      id: 1,
      precio_manual: Number(manual),
      precio_automatico: Number(auto),
      banco_nombre: banco,
      banco_titular: titular,
      banco_cuenta: cuenta,
      banco_moneda: moneda,
    });
    setMsg(error ? error.message : "Guardado");
  };

  if (!ok) return <main className="p-6">Cargando panel...</main>;

  const card = { background: "var(--card, #EFE8DC)", border: "1px solid var(--line, #e4ddd0)" };
  const input = "mt-1 w-full rounded-xl px-3 py-2 text-sm";

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <p className="text-[11px] tracking-[0.16em]" style={{ fontFamily: "Georgia, Times, serif" }}>
        RESERVO APPS
      </p>
      <h1 className="mt-2 text-2xl" style={{ fontFamily: "Georgia, Times, serif" }}>
        Panel
      </h1>

      <div className="mt-5 space-y-3">
        <Link href="/panel/locales" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Locales y equipo</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Ver si agregaron barberos</p>
        </Link>
        <Link href="/dashboard/admin" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Crear / editar locales</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Altas, planes y activar</p>
        </Link>
        <Link href="/dashboard" className="block rounded-2xl p-4" style={card}>
          <p className="font-medium">Agenda de Diano</p>
        </Link>
      </div>

      <section className="mt-6 rounded-2xl p-4" style={card}>
        <p className="font-medium">Precios</p>
        <label className="mt-3 block text-sm">Manual
          <input className={input} value={manual} onChange={(e) => setManual(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">Automático
          <input className={input} value={auto} onChange={(e) => setAuto(e.target.value)} />
        </label>
      </section>

      <section className="mt-3 rounded-2xl p-4" style={card}>
        <p className="font-medium">Cuenta para transferencias</p>
        <label className="mt-3 block text-sm">Banco
          <input className={input} value={banco} onChange={(e) => setBanco(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">Titular
          <input className={input} value={titular} onChange={(e) => setTitular(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">Nº de cuenta
          <input className={input} value={cuenta} onChange={(e) => setCuenta(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">Moneda
          <input className={input} value={moneda} onChange={(e) => setMoneda(e.target.value)} />
        </label>
        <button onClick={() => void guardar()} className="mt-4 w-full rounded-full py-3 text-sm" style={{ background: "#1A1612", color: "#F6F1E8" }}>
          Guardar precios y cuenta
        </button>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </section>
    </main>
  );
}
