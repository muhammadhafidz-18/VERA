import { NextResponse } from "next/server";
import { computeMonthlyTaskStats, getMonthlyDigestNarrative } from "@/lib/supabase/tasks";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const year = parseInt(searchParams.get("year"), 10);
  const month = parseInt(searchParams.get("month"), 10);
  const roleFilter = searchParams.get("roleFilter") || "all";

  if (!employeeId || !year || !month) {
    return NextResponse.json({ error: "employeeId, year, and month are required." }, { status: 400 });
  }

  const stats = await computeMonthlyTaskStats(employeeId, year, month, roleFilter);
  if (!stats) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  const narrativeState = await getMonthlyDigestNarrative(employeeId, year, month);
  return NextResponse.json({ stats, ...narrativeState });
}