import { NextResponse } from "next/server";
import { computeAndSyncMonthlyStats } from "@/lib/supabase/tasks";

export async function POST(request) {
  const { employeeId, year, month } = await request.json();
  if (!employeeId || !year || !month) {
    return NextResponse.json({ error: "employeeId, year, and month are required." }, { status: 400 });
  }

  const [result] = await computeAndSyncMonthlyStats([employeeId], year, month);
  if (!result) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json(result);
}