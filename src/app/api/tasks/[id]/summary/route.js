import { NextResponse } from "next/server";
import { getTaskById, updateTask } from "@/lib/supabase/tasks";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_SUMMARY } from "@/lib/vera/taskPrompts";

export async function POST(request, { params }) {
  const { id } = await params;

  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  // Limit check moved BEFORE the Claude call (previously it happened,
  // but AFTER getTaskById could still leak another user's chat transcript
  // into the prompt — that access-control gap is fixed by getTaskById now
  // returning null for non-participants, per Bug #1 fix above).
  if ((task.aiSummaryGenerateCount || 0) >= 2) {
    return NextResponse.json({ error: "You've reached the 2x generate limit for this feature." }, { status: 429 });
  }

  const realChats = task.chats.filter((c) => !c.isSystem);
  // Only block on a fully empty chat — below that, this feature now also
  // covers the old Issue Analysis role (recap + analytical breakdown), so
  // it should still run on a thin conversation and just produce a lighter
  // "Rekap Percakapan"/"Analisis" rather than refusing outright.
  if (realChats.length === 0) {
    return NextResponse.json({ error: "No chat to summarize yet." }, { status: 400 });
  }

  const transcript = realChats.map((c) => `${c.senderName || "Unknown"}: ${c.message}`).join("\n");

  try {
    const summary = await callClaude(
      TASK_SYSTEM_PROMPT_SUMMARY,
      `Task: "${task.title}"\nPriority: ${task.priority}\n\nChat history:\n${transcript}`
    );
    const previousSummary = task.aiSummary ? { content: task.aiSummary, createdAt: task.aiSummaryGeneratedAt } : null;
    const result = await updateTask(id, {
      aiSummary: summary,
      aiSummaryGeneratedAt: Date.now(),
      aiSummaryGenerateCount: (task.aiSummaryGenerateCount || 0) + 1,
    });

    // FIX (Bug #2b): don't return 200 when result.success is false.
    if (!result.success) {
      return NextResponse.json(result, { status: result.forbidden ? 403 : 400 });
    }
    return NextResponse.json({ ...result, previousSummary });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach AI. Please try again." }, { status: 502 });
  }
}