"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="h-11 px-4 rounded-full text-sm"
      style={{
        background: "var(--card)",
        color: "var(--text)",
        border: "1px solid var(--line)",
      }}
    >
      {theme === "light" ? "Oscuro" : "Claro"}
    </button>
  );
}
