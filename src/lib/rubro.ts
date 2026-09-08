export type Rubro = "barberia" | "pestanas_unas";

export function temaRubro(rubro?: string | null) {
  if (rubro === "pestanas_unas") {
    return {
      bg: "linear-gradient(180deg, #FDF7F9 0%, #F6E6EE 100%)",
      card: "#FFFFFF",
      text: "#3A2430",
      muted: "#9A7584",
      line: "#E8CED8",
      btn: "#B76E79",
      btnText: "#FFF9FB",
      cita: "Reservá tu cita",
      panel: "Panel del estudio",
      galeria: "Trabajos",
    };
  }
  return {
    bg: "#F5F0E8",
    card: "#EFE8DC",
    text: "#1C1712",
    muted: "#7a7268",
    line: "#ddd4c8",
    btn: "#1C1712",
    btnText: "#F5F0E8",
    cita: "Reservá tu turno",
    panel: "Panel del barbero",
    galeria: "Cortes",
  };
}
