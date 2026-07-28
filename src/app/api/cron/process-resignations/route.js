// src/app/api/cron/process-resignations/route.js
//
// Runs once a day. Flips any employee whose scheduled resign_date has
// arrived from "active" to "inactive" and appends ".resign" to their
// email — same logic as an immediate resign in Employee Directory, just
// automatic.
import { NextResponse } from "next/server";
import { processScheduledResignations } from "@/lib/supabase/directory";

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

  const result = await processScheduledResignations();
  return NextResponse.json(result);
}