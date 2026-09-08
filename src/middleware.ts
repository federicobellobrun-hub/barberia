import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROOT = "reservoapps.com";

function slugFromHost(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0];
  if (!host.endsWith(ROOT)) return null;
  if (host === ROOT || host === `www.${ROOT}`) return null;
  const slug = host.slice(0, -(ROOT.length + 1));
  if (!slug || slug === "www") return null;
  return slug;
}

function destino(request: NextRequest) {
  const slug = slugFromHost(request);
  if (!slug) return null;
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/b/") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/panel") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next")
  ) {
    return null;
  }
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/b/${slug}` : `/b/${slug}${pathname}`;
  return url;
}

export async function middleware(request: NextRequest) {
  const url = destino(request);

  let response = url ? NextResponse.rewrite(url) : NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = url ? NextResponse.rewrite(url) : NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
