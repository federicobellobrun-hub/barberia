"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReservarSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!slug) return;
    localStorage.setItem("barberia_slug", slug);
    router.replace(`/reservar?b=${slug}`);
  }, [slug, router]);

  return <main className="min-h-screen flex items-center justify-center">Cargando reserva...</main>;
}
