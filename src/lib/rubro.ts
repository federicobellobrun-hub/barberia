export type Rubro = "barberia" | "pestanas_unas" | "canina" | "taller" | "otro";
export type Pack = "auto" | "barberia" | "rosa" | "oscuro" | "arena" | "clinico" | "oro" | "oliva";

export const PACKS: { id: Pack; nombre: string; icono: string }[] = [
  { id: "auto", nombre: "Según el rubro", icono: "✦" },
  { id: "barberia", nombre: "Barbería vintage", icono: "✂" },
  { id: "rosa", nombre: "Estudio rosa", icono: "❀" },
  { id: "oro", nombre: "Oro tostado", icono: "◆" },
  { id: "arena", nombre: "Arena", icono: "○" },
  { id: "oliva", nombre: "Oliva", icono: "♣" },
  { id: "clinico", nombre: "Clínico", icono: "+" },
  { id: "oscuro", nombre: "Oscuro", icono: "●" },
];

export const RUBROS_OK = ["barberia", "pestanas_unas", "canina", "taller", "otro"] as const;

export function temaPack(pack?: string | null, rubro?: string | null) {
  const elegido =
    !pack || pack === "auto"
      ? rubro === "pestanas_unas"
        ? "rosa"
        : rubro === "canina"
          ? "oliva"
          : rubro === "taller"
            ? "clinico"
            : rubro === "otro"
              ? "arena"
              : "barberia"
      : pack;

  if (elegido === "rosa") {
    return { pack: "rosa", icono: "❀", bg: "linear-gradient(180deg, #FDF7F9 0%, #F6E6EE 100%)", card: "#FFFFFF", text: "#3A2430", muted: "#9A7584", line: "#E8CED8", btn: "#B76E79", btnText: "#FFF9FB", cita: "Reservá tu cita", panel: "Panel del estudio", galeria: "Trabajos" };
  }
  if (elegido === "oro") {
    return { pack: "oro", icono: "◆", bg: "#F6EFE4", card: "#C9A882", text: "#2C2116", muted: "#7A6248", line: "#B8956A", btn: "#C4A35A", btnText: "#FFF8E8", cita: "Reservá tu turno", panel: "Panel", galeria: "Trabajos" };
  }
  if (elegido === "oliva") {
    return { pack: "oliva", icono: "♣", bg: "#F3F1E8", card: "#E7E4D4", text: "#24301E", muted: "#6F7A5E", line: "#D2D0BE", btn: "#4E5A32", btnText: "#F4F2E6", cita: "Reservá tu turno", panel: "Panel", galeria: "Trabajos" };
  }
  if (elegido === "oscuro") {
    return { pack: "oscuro", icono: "●", bg: "#121212", card: "#1C1C1C", text: "#F4EFE6", muted: "#9A948A", line: "#2A2A2A", btn: "#F4EFE6", btnText: "#121212", cita: "Reservá tu turno", panel: "Panel", galeria: "Trabajos" };
  }
  if (elegido === "arena") {
    return { pack: "arena", icono: "○", bg: "#EDE4D4", card: "#F7F1E6", text: "#3F2E1E", muted: "#8A7358", line: "#D9CBB3", btn: "#6B4F32", btnText: "#F7F1E6", cita: "Reservá tu turno", panel: "Panel", galeria: "Trabajos" };
  }
  if (elegido === "clinico") {
    return { pack: "clinico", icono: "+", bg: "#F4F7F8", card: "#FFFFFF", text: "#1B2A32", muted: "#6B7C86", line: "#D5DEE3", btn: "#2F6F7E", btnText: "#FFFFFF", cita: "Reservá tu cita", panel: "Panel", galeria: "Trabajos" };
  }
  return { pack: "barberia", icono: "✂", bg: "#F5F0E8", card: "#EFE8DC", text: "#1C1712", muted: "#7a7268", line: "#ddd4c8", btn: "#1C1712", btnText: "#F5F0E8", cita: "Reservá tu turno", panel: "Panel del barbero", galeria: "Cortes" };
}

export function temaRubro(rubro?: string | null) {
  return temaPack("auto", rubro);
}

export function aplicarTema(t: ReturnType<typeof temaPack>) {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  const bg = t.bg.startsWith("linear") ? "#FDF7F9" : t.bg;
  r.style.setProperty("--bg", bg);
  r.style.setProperty("--card", t.card);
  r.style.setProperty("--text", t.text);
  r.style.setProperty("--muted", t.muted);
  r.style.setProperty("--line", t.line);
}
