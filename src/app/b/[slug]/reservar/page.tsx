"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function ReservarSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (!slug) return;
    localStorage.setItem("barberia_slug", slug);
    window.location.replace(`/reservar?b=${slug}`);
  }, [slug]);

  return <main className="min-h-screen flex items-center justify-center">Cargando reserva...</main>;
}
