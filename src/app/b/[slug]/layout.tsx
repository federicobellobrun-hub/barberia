import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { title: slug };
  const supabase = createClient(url, key);
  const { data } = await supabase.from("barberias").select("nombre").eq("slug", slug).maybeSingle();
  return { title: data?.nombre || slug };
}

export default function Layout({ children }: Props) {
  return children;
}
