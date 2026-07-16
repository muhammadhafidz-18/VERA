// src/lib/supabase/middleware.js
//
// Refreshes the Supabase auth token on every request and redirects
// unauthenticated users away from protected routes. Called from the root
// middleware.js (Next.js only picks up middleware.js at the project root).
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/reset-password"];

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars aren't set yet, don't crash every request — just pass
  // through so the app still boots and shows a clear error where it's used.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // IMPORTANT: do not run any code between createServerClient and
  // getUser() — it revalidates the token against Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic && path !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && path === "/login") {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/vera";
    return NextResponse.redirect(dashUrl);
  }

  return response;
}
