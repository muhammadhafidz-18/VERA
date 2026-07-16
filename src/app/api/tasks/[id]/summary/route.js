import { NextResponse } from "next/server";
import { getTaskById, updateTask, taskUserById } from "@/lib/vera/store";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_SUMMARY } from "@/lib/vera/taskPrompts";

export async function POST(request, { params }) {
  const { id } = await params;
  const task = getTaskById(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if ((task.aiSummaryGenerateCount || 0) >= 2) {
    return NextResponse.json({ error: "You've reached the 2x generate limit for this feature." }, { status: 429 });
  }
  if (task.chats.length === 0) {
    return NextResponse.json({ error: "No chat to summarize yet." }, { status: 400 });
  }

  const transcript = task.chats
    .filter((c) => !c.isSystem)
    .map((c) => `${taskUserById(c.senderId).name}: ${c.message}`)
    .join("\n");

  try {
    const summary = await callClaude(TASK_SYSTEM_PROMPT_SUMMARY, `Chat history for task "${task.title}":\n\n${transcript}`);
    const previousSummary = task.aiSummary ? { content: task.aiSummary, createdAt: task.aiSummaryGeneratedAt } : null;
    const result = updateTask(id, {
      aiSummary: summary,
      aiSummaryGeneratedAt: Date.now(),
      aiSummaryGenerateCount: (task.aiSummaryGenerateCount || 0) + 1,
    });
    return NextResponse.json({ ...result, previousSummary });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach AI. Please try again." }, { status: 502 });
  }
}
