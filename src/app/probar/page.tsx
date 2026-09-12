"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProbarPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rubro, setRubro] = useState("barberia");
  const [modo, setModo] = useState<"manual" | "automatico">("automatico");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const res = await fetch("/api/demo/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password, whatsapp, rubro, modo }),
    });
    const data = await res.json();
    setEnviando(false);
    if (!res.ok) return setError(data.error || "No se pudo crear");
    router.push("/login");
  };

  const campo = "w-full rounded-2xl px-4 py-3 mb-3";
  const estilo = { background: "#EFE8DC", border: "1px solid #ddd4c8", color: "#1C1712" };

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="max-w-md mx-auto px-5 pt-8 pb-16">
        <Link href="/" className="text-sm" style={{ color: "#7a7268" }}>‹ Reservo</Link>
        <h1 className="text-[34px] mt-6 mb-2" style={{ fontFamily: "Georgia, Times, serif" }}>
          Probá 7 días
        </h1>
        <p className="text-sm mb-8" style={{ color: "#7a7268" }}>
          Armá tu local. A los 7 días se congela hasta activar el plan.
        </p>
        <form onSubmit={crear}>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del local" className={campo} style={estilo} />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email" className={campo} style={estilo} />
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (6+)" className={campo} style={estilo} />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp. Ej: 099123456" className={campo} style={estilo} />
          <p className="text-sm mb-2">Rubro</p>
          <select value={rubro} onChange={(e) => setRubro(e.target.value)} className={campo} style={estilo}>
            <option value="barberia">Barbería</option>
            <option value="pestanas_unas">Pestañas y uñas</option>
          </select>
          <p className="text-sm mb-2">Cómo querés probar</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button type="button" onClick={() => setModo("manual")} className="py-3 text-sm rounded-2xl" style={{ background: modo === "manual" ? "#1C1712" : "#EFE8DC", color: modo === "manual" ? "#F5F0E8" : "#1C1712" }}>
              Manual
            </button>
            <button type="button" onClick={() => setModo("automatico")} className="py-3 text-sm rounded-2xl" style={{ background: modo === "automatico" ? "#1C1712" : "#EFE8DC", color: modo === "automatico" ? "#F5F0E8" : "#1C1712" }}>
              Automático
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: "#7a7268" }}>
            {modo === "automatico"
              ? "Los avisos salen solos (tope de prueba). Ideal para ver la diferencia."
              : "Vos avisás por WhatsApp. Sin costo de Meta."}
          </p>
          <button disabled={enviando} className="w-full rounded-2xl py-4 font-medium" style={{ background: "#1C1712", color: "#F5F0E8" }}>
            {enviando ? "Creando..." : "Empezar prueba"}
          </button>
        </form>
      </div>
    </main>
  );
}
