import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ b?: string; shop?: string }>;
}) {
  const params = await searchParams;
  const b = params.b || params.shop || "";
  redirect(b ? `/resena?b=${encodeURIComponent(b)}` : "/");
}
