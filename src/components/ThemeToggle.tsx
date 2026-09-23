"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tema") === "oscuro";
    setOscuro(saved);
    document.documentElement.setAttribute("data-tema", saved ? "oscuro" : "claro");
  }, []);

  const toggle = () => {
    const next = !oscuro;
    setOscuro(next);
    localStorage.setItem("tema", next ? "oscuro" : "claro");
    document.documentElement.setAttribute("data-tema", next ? "oscuro" : "claro");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full px-3 py-1.5 text-sm"
      style={{ border: "1px solid var(--line)" }}
    >
      {oscuro ? "Claro" : "Oscuro"}
    </button>
  );
}
