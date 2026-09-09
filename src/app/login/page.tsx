"use client";

import { useState, Suspense } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      setMsg("Email o contraseña incorrectos");
      return;
    }

    const { data: yo } = await supabase.from("usuarios").select("rol").eq("auth_user_id", data.user.id).maybeSingle();
    setLoading(false);

    const next = search.get("next");
    if (next === "/panel" || next === "/dashboard") {
      router.push(next);
      return;
    }
    if (yo?.rol === "superadmin") router.push("/dashboard");
    else router.push("/dashboard");
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link href="/" className="text-sm text-[#7a7268]">
          ← Inicio
        </Link>
        <h1 className="mt-8 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>
          Ingresar
        </h1>
        <p className="text-sm text-[#7a7268] mb-8">Entras a la agenda del local.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input type="email" required className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
            {loading ? "Entrando..." : "Entrar a la agenda"}
          </button>
          {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
        </form>

        <Link href="/login?next=/panel" className="block mt-8 text-center text-xs text-[#9a9388]">
          Panel Reservo Apps
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-6">Cargando...</main>}>
      <LoginForm />
    </Suspense>
  );
}
