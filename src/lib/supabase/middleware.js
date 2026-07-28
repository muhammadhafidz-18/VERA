// src/lib/supabase/middleware.js
//
// Refreshes the Supabase auth token on every request, redirects
// unauthenticated users away from protected routes, and redirects
// non-Superadmin users away from /settings. This is a UX-level guard only
// — the real enforcement lives server-side in each API route handler
// (see src/lib/supabase/authGuard.js), because middleware can have blind
// spots (a new route that forgets to check matcher, etc).
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/reset-password", "/explore-features"];
const SUPERADMIN_ONLY_PATHS = ["/settings"];

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Cron endpoints are called by external schedulers (cron-job.org) — they
  // have no browser cookie/session at all, and authenticate themselves via
  // the CRON_SECRET bearer token checked inside each route handler. This
  // middleware must never redirect them to /login.
  const isCronRoute = path.startsWith("/api/cron/");

  if (!user && !isPublic && !isCronRoute && path !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && path === "/login") {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/vera";
    return NextResponse.redirect(dashUrl);
  }

  if (user && SUPERADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
    const { data: employee } = await supabase
      .from("employees")
      .select("roles ( name )")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const role = employee?.roles?.name || "User";
    if (role !== "Superadmin") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/vera";
      return NextResponse.redirect(homeUrl);
    }
  }

  return response;
}