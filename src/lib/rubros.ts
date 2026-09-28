export const RUBROS = [
  { id: "barberia", nombre: "Barbería", recurso: "Barbero", recursoPlural: "Barberos" },
  { id: "peluqueria", nombre: "Peluquería", recurso: "Peluquero", recursoPlural: "Peluqueros" },
  { id: "pestanas_unas", nombre: "Pestañas y uñas", recurso: "Profesional", recursoPlural: "Equipo" },
  { id: "cejas_unas", nombre: "Cejas y uñas", recurso: "Profesional", recursoPlural: "Equipo" },
  { id: "estetica", nombre: "Centro de estética", recurso: "Profesional", recursoPlural: "Equipo" },
  { id: "masajes", nombre: "Masajes / spa", recurso: "Profesional", recursoPlural: "Equipo" },
  { id: "tatuajes", nombre: "Tatuajes / piercing", recurso: "Artista", recursoPlural: "Artistas" },
  { id: "canina", nombre: "Peluquería canina", recurso: "Peluquero", recursoPlural: "Peluqueros" },
  { id: "veterinaria", nombre: "Veterinaria", recurso: "Profesional", recursoPlural: "Equipo" },
  { id: "taller", nombre: "Taller / gomería", recurso: "Mecánico", recursoPlural: "Mecánicos" },
  { id: "padel", nombre: "Pádel", recurso: "Cancha", recursoPlural: "Canchas" },
  { id: "futbol5", nombre: "Fútbol 5", recurso: "Cancha", recursoPlural: "Canchas" },
  { id: "tenis", nombre: "Tenis", recurso: "Cancha", recursoPlural: "Canchas" },
  { id: "consultorio", nombre: "Consultorio / estudio", recurso: "Profesional", recursoPlural: "Equipo" },
  { id: "otro", nombre: "Otro rubro", recurso: "Profesional", recursoPlural: "Equipo" },
] as const;

export const RUBROS_OK = RUBROS.map((r) => r.id);

export function rubroOk(v: unknown) {
  return typeof v === "string" && RUBROS_OK.includes(v as (typeof RUBROS_OK)[number]) ? v : "barberia";
}

export function labelsDe(rubro: string | null | undefined) {
  const r = RUBROS.find((x) => x.id === rubro) || RUBROS[0];
  return { uno: r.recurso.toLowerCase(), titulo: r.recursoPlural, recurso: r.recurso };
}
