// src/lib/supabase/client.js
//
// Supabase client for the browser (Client Components). Uses the public
// anon key — safe to expose, access is controlled by Row Level Security
// policies on the database side (see supabase/vera_schema.sql; RLS is
// still a TODO there — Fase 5).
"use client";
import { createBrowserClient } from "@supabase/ssr";

let browserClient;

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project values."
    );
  }

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
