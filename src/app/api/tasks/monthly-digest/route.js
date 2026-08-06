import { NextResponse } from "next/server";
import { getMonthlyDigestCached } from "@/lib/supabase/tasks";

// Read-only — this NEVER computes stats live anymore. It only returns
// whatever the last "Hitung Sekarang" / "Sync Semua Employee" click
// saved. If nobody has synced this employee/month yet, stats comes back
// null and the page shows an empty state with a sync button instead of
// silently crunching numbers on every page view.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const year = parseInt(searchParams.get("year"), 10);
  const month = parseInt(searchParams.get("month"), 10);
  const roleFilter = searchParams.get("roleFilter") || "all";

  if (!employeeId || !year || !month) {
    return NextResponse.json({ error: "employeeId, year, and month are required." }, { status: 400 });
  }

  const cached = await getMonthlyDigestCached(employeeId, year, month);
  if (!cached) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  const statsByFilter = { all: cached.statsAll, assigned_to_me: cached.statsToMe, assigned_by_me: cached.statsByMe };

  return NextResponse.json({
    stats: statsByFilter[roleFilter] || null,
    syncedAt: cached.syncedAt,
    narrative: cached.narrative,
    generatedAt: cached.generatedAt,
    generateCount: cached.generateCount,
  });
}