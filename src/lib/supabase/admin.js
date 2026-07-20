// src/lib/supabase/admin.js
//
// SERVICE ROLE client — bypasses RLS and has access to the admin Auth API
// (inviteUserByEmail, deleteUser, etc). Only import this from server-side
// route handlers. Never import it from a "use client" component — the
// service role key must never reach the browser.
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

let adminClient;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. These must be set in .env.local (see scripts/seed-auth-users.mjs for the same requirement)."
    );
  }

  adminClient = createSupabaseJsClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}