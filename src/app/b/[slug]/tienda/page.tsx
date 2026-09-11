"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TiendaPorSlug() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/tienda?b=${slug}`);
  }, [slug, router]);
  return <main className="min-h-screen flex items-center justify-center">Cargando tienda...</main>;
}
