"use client";

import { useEffect, useState } from "react";

function aplicar(oscuro: boolean) {
  const root = document.documentElement;
  root.classList.toggle("oscuro", oscuro);
  root.setAttribute("data-tema", oscuro ? "oscuro" : "claro");
  root.style.setProperty("--bg", oscuro ? "#161310" : "#F6F1E8");
  root.style.setProperty("--fg", oscuro ? "#F6F1E8" : "#1A1612");
  root.style.setProperty("--card", oscuro ? "#231f1a" : "#ffffff");
  root.style.setProperty("--line", oscuro ? "#3a342c" : "#e6e0d4");
  root.style.setProperty("--muted", oscuro ? "#b8b0a4" : "#8A8378");
  document.body.style.background = oscuro ? "#161310" : "";
  document.body.style.color = oscuro ? "#F6F1E8" : "";
}

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tema") === "oscuro";
    setOscuro(saved);
    aplicar(saved);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !oscuro;
        setOscuro(next);
        localStorage.setItem("tema", next ? "oscuro" : "claro");
        aplicar(next);
      }}
      className="rounded-full px-3 py-1.5 text-xs"
      style={{ border: "1px solid var(--line)" }}
    >
      {oscuro ? "Claro" : "Oscuro"}
    </button>
  );
}
