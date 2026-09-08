export type Rubro = "barberia" | "pestanas_unas";

export function temaRubro(rubro?: string | null) {
  if (rubro === "pestanas_unas") {
    return {
      bg: "#FBF6F8",
      card: "#F4E8EE",
      text: "#3A2430",
      muted: "#8A6F7A",
      line: "#E4D0D8",
      btn: "#6B3148",
      btnText: "#FBF6F8",
      cita: "Reservá tu cita",
      panel: "Panel del estudio",
      galeria: "Trabajos",
      profesional: "Profesional",
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
    profesional: "Barbero",
  };
}
