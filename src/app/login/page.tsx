"use client";

import { useState, Suspense } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

function subdominio() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.replace(/^www\./, "");
  if (!host.endsWith(".reservoapps.com")) return "";
  const sub = host.replace(/\.reservoapps\.com$/, "");
  if (!sub || sub === "www") return "";
  return sub;
}

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

    const { data: yo } = await supabase
      .from("usuarios")
      .select("rol, barberias(slug, nombre)")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    const shop = Array.isArray(yo?.barberias) ? yo?.barberias[0] : yo?.barberias;
    const slug = shop?.slug || "";
    const host = subdominio();

    if (host && slug && host !== slug && yo?.rol !== "superadmin") {
      await supabase.auth.signOut();
      try {
        localStorage.removeItem("barberia_slug");
      } catch {
        /* ignore */
      }
      setLoading(false);
      setMsg(`Esta cuenta es de ${shop?.nombre || slug}. Entrá en ${slug}.reservoapps.com`);
      return;
    }

    try {
      localStorage.setItem("barberia_slug", slug);
      sessionStorage.clear();
    } catch {
      /* ignore */
    }

    setLoading(false);
    if (search.get("next") === "/panel" || yo?.rol === "superadmin") {
      router.push("/panel");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F0E8", color: "#1C1712" }}>
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link href="/" className="text-sm text-[#7a7268]">← Inicio</Link>
        <h1 className="mt-8 text-3xl" style={{ fontFamily: "Georgia, Times, serif" }}>Ingresar</h1>
        <p className="text-sm text-[#7a7268] mb-8">Entras a la agenda del local.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="email" required className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full rounded-xl px-3 py-3 bg-transparent" style={{ border: "1px solid #ddd4c8" }} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm" style={{ background: "#1C1712", color: "#F5F0E8" }}>
            {loading ? "Entrando..." : "Entrar a la agenda"}
          </button>
          {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
        </form>
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
