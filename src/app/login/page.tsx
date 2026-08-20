"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-end mb-16">
          <ThemeToggle />
        </div>

        <h1 className="text-5xl font-semibold tracking-tight mb-10">Panel</h1>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl px-5 py-4 outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              color: "var(--text)",
            }}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-2xl px-5 py-4 outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              color: "var(--text)",
            }}
          />

          <button
            disabled={loading}
            className="w-full rounded-2xl py-4 font-medium disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
