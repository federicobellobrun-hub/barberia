"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Persona = { nombre: string; telefono: string };
type Servicio = { nombre: string; precio: number };
type Pago = { id: string; monto: number; metodo: string };

type Turno = {
  id: string;
  barberia_id: string;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string;
  clientes: Persona | Persona[] | null;
  servicios: Servicio | Servicio[] | null;
  pagos: Pago | Pago[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function ymd(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
}

function addDays(value: string, days: number) {
  const d = new Date(`${value}T12:00:00-03:00`);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function horaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });
}

function fechaUy(fechaHora: string) {
  return new Date(fechaHora).toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Montevideo",
  });
}

function waNumber(telefono: string) {
  const solo = telefono.replace(/\D/g, "");
  if (solo.startsWith("598")) return solo;
  if (solo.startsWith("0")) return `598${solo.slice(1)}`;
  return `598${solo}`;
}

function abrirWhatsapp(telefono: string, texto: string) {
  const url = `https://wa.me/${waNumber(telefono)}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

export default function DashboardPage() {
  const [nombre, setNombre] = useState("Barbero");
  const [fecha, setFecha] = useState(ymd(new Date()));
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("auth_user_id", user.id)
        .single();
      if (data?.nombre) setNombre(data.nombre);
    };
    loadUser();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const desde = new Date(`${fecha}T00:00:00-03:00`).toISOString();
      const hasta = new Date(`${fecha}T23:59:59-03:00`).toISOString();
      const mes = fecha.slice(0, 7);
      const inicioMes = new Date(`${mes}-01T00:00:00-03:00`).toISOString();
      const siguiente = new Date(`${mes}-01T00:00:00-03:00`);
      siguiente.setMonth(siguiente.getMonth() + 1);

      const [turnosRes, pagosMesRes] = await Promise.all([
        supabase
          .from("turnos")
          .select(
            "id, barberia_id, fecha_hora, duracion_minutos, estado, clientes(nombre, telefono), servicios(nombre, precio), pagos(id, monto, metodo)"
          )
          .gte("fecha_hora", desde)
          .lte("fecha_hora", hasta)
          .neq("estado", "cancelado")
          .order("fecha_hora"),
        supabase
          .from("pagos")
          .select("monto")
          .gte("pagado_at", inicioMes)
          .lt("pagado_at", siguiente.toISOString()),
      ]);

      if (turnosRes.error) setError(turnosRes.error.message);
      setTurnos((turnosRes.data as any) || []);
      setTotalMes(
        (pagosMesRes.data || []).reduce(
          (acc: number, p: { monto: number }) => acc + Number(p.monto || 0),
          0
        )
      );
      setLoading(false);
    };
    load();
  }, [fecha]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("nuevas-reservas")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "turnos" },
        async (payload: any) => {
          const turno = payload.new;
          let texto = "Entró un turno nuevo";

          if (turno?.cliente_id) {
            const { data } = await supabase
              .from("clientes")
              .select("nombre")
              .eq("id", turno.cliente_id)
              .single();
            if (data?.nombre) {
              const hora = new Date(turno.fecha_hora).toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Montevideo",
              });
              texto = `${data.nombre} reservó a las ${hora}`;
            }
          }

          setAviso(texto);

          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Nueva reserva", { body: texto });
            }
          }

          const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
          audio.play().catch(() => {});

          setTimeout(() => window.location.reload(), 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalDia = useMemo(() => {
    return turnos.reduce((acc, t) => acc + Number(one(t.pagos)?.monto || 0), 0);
  }, [turnos]);

  const cambiarEstado = async (id: string, estado: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTurnos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
  };

  const registrarPago = async (turno: Turno, metodo: "efectivo" | "transferencia") => {
    const supabase = createClient();
    const monto = Number(one(turno.servicios)?.precio ||
