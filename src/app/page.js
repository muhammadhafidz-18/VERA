"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSession, clearSession } from "@/lib/session";
import { signOut } from "@/lib/supabase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = loadSession();
    if (session?.stage === "dashboard") {
      router.replace("/vera");
    } else {
      // sessionStorage says there's no active dashboard session (expired,
      // cleared, or never set). Explicitly sign out too — otherwise a
      // still-valid Supabase cookie makes middleware.js bounce this
      // /login redirect straight back to /vera (same root cause as the
      // DashboardLayout fix). A no-op signOut() is harmless when there
      // was no session to begin with.
      clearSession();
      signOut().finally(() => router.replace("/login"));
    }
  }, [router]);

  return null;
}