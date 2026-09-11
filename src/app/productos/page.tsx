"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductosRedirect() {
  const router = useRouter();
  useEffect(() => {
    const slug = typeof window !== "undefined" ? localStorage.getItem("barberia_slug") : null;
    router.replace(slug ? `/tienda?b=${slug}` : "/tienda");
  }, [router]);
  return <main className="min-h-screen flex items-center justify-center">Cargando tienda...</main>;
}
