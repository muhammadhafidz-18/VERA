// src/app/api/cron/meeting-reminders/route.js
//
// Needs to run every ~5 minutes to catch the 15-minute-before window
// accurately. On Vercel Hobby plan, Vercel Cron is capped at once/day —
// use an external scheduler (e.g. cron-job.org) hitting this URL every 5
// minutes instead, with the same CRON_SECRET as a Bearer token or a
// ?secret= query param (for quick manual browser testing).
import { NextResponse } from "next/server";
import { notifyUpcomingMeetings } from "@/lib/supabase/meetings";

export async function GET(request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await notifyUpcomingMeetings();
  return NextResponse.json(result);
}