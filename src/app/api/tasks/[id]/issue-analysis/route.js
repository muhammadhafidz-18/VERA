import { NextResponse } from "next/server";
import { getTaskById, updateTask } from "@/lib/supabase/tasks";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_ISSUE_ANALYSIS } from "@/lib/vera/taskPrompts";

export async function POST(request, { params }) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if ((task.aiIssueAnalysisGenerateCount || 0) >= 2) {
    return NextResponse.json({ error: "You've reached the 2x generate limit for this feature." }, { status: 429 });
  }
  if (task.chats.length === 0 && !task.description.trim()) {
    return NextResponse.json({ error: "No description or chat to analyze yet." }, { status: 400 });
  }

  const transcript = task.chats
    .filter((c) => !c.isSystem)
    .map((c) => `${c.senderName || "Unknown"}: ${c.message}`)
    .join("\n");
  const contextText = `Task: "${task.title}"\n\nDescription:\n${task.description}\n\nChat history:\n${transcript || "(no chat yet)"}`;

  try {
    const analysis = await callClaude(TASK_SYSTEM_PROMPT_ISSUE_ANALYSIS, contextText);
    const previousAnalysis = task.aiIssueAnalysis ? { content: task.aiIssueAnalysis, createdAt: task.aiIssueAnalysisGeneratedAt } : null;
    const result = await updateTask(id, {
      aiIssueAnalysis: analysis,
      aiIssueAnalysisGeneratedAt: Date.now(),
      aiIssueAnalysisGenerateCount: (task.aiIssueAnalysisGenerateCount || 0) + 1,
    });
    return NextResponse.json({ ...result, previousAnalysis });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach AI. Please try again." }, { status: 502 });
  }
}
