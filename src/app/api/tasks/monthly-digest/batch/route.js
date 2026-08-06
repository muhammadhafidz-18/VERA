import { NextResponse } from "next/server";
import { getMonthlyDigestCachedBatch } from "@/lib/supabase/tasks";

// Powers "Export Excel (Semua Karyawan)". Read-only, like the single-
// employee GET route — it does NOT trigger a sync. If an employee hasn't
// been synced this month, their row in the export shows up empty with a
// "(belum di-sync)" note rather than silently computing fresh numbers
// that wouldn't match what the on-screen digest says.
export async function POST(request) {
  const { employeeIds, year, month, roleFilter } = await request.json();

  if (!Array.isArray(employeeIds) || employeeIds.length === 0 || !year || !month) {
    return NextResponse.json({ error: "employeeIds (array), year, and month are required." }, { status: 400 });
  }

  const rows = await getMonthlyDigestCachedBatch(employeeIds, year, month);
  const filterKey = { all: "statsAll", assigned_to_me: "statsToMe", assigned_by_me: "statsByMe" }[roleFilter || "all"];

  const results = rows.map((r) => ({
    employee: r.employee,
    stats: r[filterKey] || null,
    narrative: r.narrative || null,
    syncedAt: r.syncedAt,
  }));

  return NextResponse.json({ results });
}