"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type Servicio = {
  id: string;
  barberia_id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
};
type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };
type Bloqueo = { fecha_inicio: string; fecha_fin: string; todo_el_dia: boolean };
type Turno = { fecha_hora: string; duracion_minutos: number };

function ymdMontevideo(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}
function weekdayMontevideo(date: Date) {
  const wd = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Montevideo" });
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? date.getDay();
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function IconScissors() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.2 7.6 20 18M8.2 16.4 20 6" />
    </svg>
  );
}
function IconRazor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 8h12M7 8v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8M16 6l4 4" />
    </svg>
  );
}
function IconComb() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 4v16M9 4v16M13 4v16M17 4v16M5 4h12M5 20h12" />
    </svg>
  );
}
function iconoDe(nombre: string) {
  const n = nombre.toLowerCase();
  if (n.includes("barba") && n.includes("corte")) return <IconComb />;
  if (n.includes("barba")) return <IconRazor />;
  return <IconScissors />;
}

export default function ReservarPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const desde = new Date();
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 40);
        const [servRes, horRes, bloqRes, turRes] = await Promise.all([
          supabase.from("servicios").select("id, barberia_id, nombre, duracion_minutos, precio").eq("activo", true).order("orden"),
          supabase.from("horario_semanal").select("dia_semana, hora_inicio, hora_fin").eq("activo", true),
          supabase.from("bloqueos").select("fecha_inicio, fecha_fin, todo_el_dia"),
          supabase.from("turnos").select("fecha_hora, duracion_minutos").in("estado", ["pendiente", "confirmado", "realizado"]).gte("fecha_hora", desde.toISOString()).lte("fecha_hora", hasta.toISOString()),
        ]);
        if (servRes.error) throw new Error(servRes.error.message);
        setServicios(servRes.data || []);
        setHorarios(horRes.data || []);
        setBloqueos(bloqRes.data || []);
        setTurnos(turRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const celdasMes = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      cells
