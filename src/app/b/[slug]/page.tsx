"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import ShopHome from "@/components/ShopHome";

export default function LocalPage() {
  const { slug } = useParams<{ slug: string }>();
  useEffect(() => {
    if (slug) localStorage.setItem("barberia_slug", String(slug));
  }, [slug]);
  return <ShopHome />;
}
