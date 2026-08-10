import { NextResponse } from "next/server";
import { getTaskById, updateTask } from "@/lib/supabase/tasks";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_ISSUE_ANALYSIS } from "@/lib/vera/taskPrompts";

// Minimum number of real (non-system) chat messages required before Issue
// Analysis can run. Below this, there simply isn't enough back-and-forth
// for a meaningful issue breakdown — title + description alone used to be
// accepted, but that produced thin, low-value analyses that leaned on the
// model's own inference more than actual conversation content. Requiring
// a real conversation first keeps the analysis grounded in what people
// actually said, not just a one-line task description.
const MIN_CHATS_FOR_ANALYSIS = 10;

export async function POST(request, { params }) {
  const { id } = await params;

  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  if ((task.aiIssueAnalysisGenerateCount || 0) >= 2) {
    return NextResponse.json({ error: "You've reached the 2x generate limit for this feature." }, { status: 429 });
  }

  const realChats = task.chats.filter((c) => !c.isSystem);
  if (realChats.length < MIN_CHATS_FOR_ANALYSIS) {
    return NextResponse.json(
      {
        error: `Minimal ${MIN_CHATS_FOR_ANALYSIS} pesan chat dulu sebelum bisa dianalisis (saat ini ${realChats.length}/${MIN_CHATS_FOR_ANALYSIS}).`,
      },
      { status: 400 }
    );
  }

  const transcript = realChats.map((c) => `${c.senderName || "Unknown"}: ${c.message}`).join("\n");
  const contextText = `Task: "${task.title}"\nPriority: ${task.priority}\n\nDescription:\n${task.description}\n\nChat history:\n${transcript}`;

  try {
    const analysis = await callClaude(TASK_SYSTEM_PROMPT_ISSUE_ANALYSIS, contextText);
    const previousAnalysis = task.aiIssueAnalysis ? { content: task.aiIssueAnalysis, createdAt: task.aiIssueAnalysisGeneratedAt } : null;
    const result = await updateTask(id, {
      aiIssueAnalysis: analysis,
      aiIssueAnalysisGeneratedAt: Date.now(),
      aiIssueAnalysisGenerateCount: (task.aiIssueAnalysisGenerateCount || 0) + 1,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: result.forbidden ? 403 : 400 });
    }
    return NextResponse.json({ ...result, previousAnalysis });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach AI. Please try again." }, { status: 502 });
  }
}