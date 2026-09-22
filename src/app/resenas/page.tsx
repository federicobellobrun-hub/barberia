
import { redirect } from "next/navigation";

export default function Page({
  searchParams,
}: {
  searchParams: { b?: string; shop?: string };
}) {
  const b = searchParams.b || searchParams.shop || "";
  redirect(b ? `/resena?b=${b}` : "/");
}
