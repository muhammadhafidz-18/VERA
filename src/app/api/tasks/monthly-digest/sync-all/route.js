import { NextResponse } from "next/server";
import { computeAndSyncMonthlyStats } from "@/lib/supabase/tasks";

export async function POST(request) {
  const { employeeIds, year, month } = await request.json();
  if (!Array.isArray(employeeIds) || employeeIds.length === 0 || !year || !month) {
    return NextResponse.json({ error: "employeeIds (array), year, and month are required." }, { status: 400 });
  }

  const results = await computeAndSyncMonthlyStats(employeeIds, year, month);
  return NextResponse.json({ results, syncedCount: results.length });
}