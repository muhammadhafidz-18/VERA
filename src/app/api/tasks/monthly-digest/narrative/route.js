import { NextResponse } from "next/server";
import { computeMonthlyTaskStats, getMonthlyDigestNarrative, saveMonthlyDigestNarrative } from "@/lib/supabase/tasks";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_MONTHLY_DIGEST } from "@/lib/vera/taskPrompts";

function formatDuration(ms) {
  if (ms == null) return "-";
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return "< 1 menit";
  if (totalMinutes < 60) return `${totalMinutes} menit`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} hari ${remHours} jam` : `${days} hari`;
}

function formatStatsBlock(label, s) {
  if (!s) return `${label}: tidak ada data.`;
  return `${label}:
- Total tiket: ${s.totalTickets}
- Sudah direspon: ${s.respondedCount}
- Belum direspon: ${s.unrespondedCount}
- Rata-rata first response: ${s.avgMs != null ? formatDuration(s.avgMs) : "tidak ada data"}
- Respon tercepat: ${s.fastest ? `${formatDuration(s.fastest.responseMs)} (tiket "${s.fastest.title}")` : "-"}
- Respon terlama: ${s.slowest ? `${formatDuration(s.slowest.responseMs)} (tiket "${s.slowest.title}")` : "-"}`;
}

export async function POST(request) {
  const { employeeId, year, month } = await request.json();
  if (!employeeId || !year || !month) {
    return NextResponse.json({ error: "employeeId, year, and month are required." }, { status: 400 });
  }

  const narrativeState = await getMonthlyDigestNarrative(employeeId, year, month);
  if ((narrativeState.generateCount || 0) >= 2) {
    return NextResponse.json({ error: "You've reached the 2x generate limit for this month/agent." }, { status: 429 });
  }

  // Always compute all 3 angles, regardless of which filter is active on
  // screen — the narrative is meant to cover all of them in one go.
  const [statsAll, statsToMe, statsByMe] = await Promise.all([
    computeMonthlyTaskStats(employeeId, year, month, "all"),
    computeMonthlyTaskStats(employeeId, year, month, "assigned_to_me"),
    computeMonthlyTaskStats(employeeId, year, month, "assigned_by_me"),
  ]);

  if (!statsAll) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  if (statsAll.totalTickets === 0) {
    return NextResponse.json({ error: "No tickets this month to analyze." }, { status: 400 });
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const dataText = `Agent: ${statsAll.employeeName}
Periode: ${monthLabel}

${formatStatsBlock("GABUNGAN (Semua)", statsAll)}

${formatStatsBlock("DITUGASKAN KE DIA", statsToMe)}

${formatStatsBlock("DIA YANG ASSIGN", statsByMe)}`;

  try {
    const narrative = await callClaude(TASK_SYSTEM_PROMPT_MONTHLY_DIGEST, dataText);
    const saveResult = await saveMonthlyDigestNarrative(employeeId, year, month, narrative);
    if (!saveResult.success) return NextResponse.json({ error: saveResult.error }, { status: 400 });
    return NextResponse.json({ narrative, generateCount: saveResult.generateCount });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach AI. Please try again." }, { status: 502 });
  }
}