// middleware.js
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (static assets)
     * - favicon.ico, public files (images, videos)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|mp4|ico|webp)$).*)",
  ],
};
