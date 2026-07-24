// src/app/api/cron/overdue-tasks/route.js
import { NextResponse } from "next/server";
import { notifyOverdueTasks } from "@/lib/supabase/tasks";

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

  const result = await notifyOverdueTasks();
  return NextResponse.json(result);
}