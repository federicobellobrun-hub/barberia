export const RUBROS = [
  { id: "barberia", nombre: "Barbería", recurso: "Barbero" },
  { id: "peluqueria", nombre: "Peluquería", recurso: "Peluquero" },
  { id: "pestanas_unas", nombre: "Pestañas y uñas", recurso: "Equipo" },
  { id: "cejas_unas", nombre: "Cejas y uñas", recurso: "Equipo" },
  { id: "estetica", nombre: "Centro de estética", recurso: "Equipo" },
  { id: "masajes", nombre: "Masajes / spa", recurso: "Profesional" },
  { id: "tatuajes", nombre: "Tatuajes / piercing", recurso: "Artista" },
  { id: "canina", nombre: "Peluquería canina", recurso: "Peluquero" },
  { id: "veterinaria", nombre: "Veterinaria", recurso: "Profesional" },
  { id: "taller", nombre: "Taller / gomería", recurso: "Mecánico" },
  { id: "padel", nombre: "Pádel", recurso: "Cancha" },
  { id: "futbol5", nombre: "Fútbol 5", recurso: "Cancha" },
  { id: "tenis", nombre: "Tenis", recurso: "Cancha" },
  { id: "consultorio", nombre: "Consultorio / estudio", recurso: "Profesional" },
  { id: "otro", nombre: "Otro rubro", recurso: "Profesional" },
] as const;

export const RUBROS_OK = RUBROS.map((r) => r.id);

export function rubroOk(v: unknown) {
  return typeof v === "string" && RUBROS_OK.includes(v as (typeof RUBROS_OK)[number]) ? v : "barberia";
}
