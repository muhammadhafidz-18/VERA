import { NextResponse } from "next/server";
import { addTaskChat } from "@/lib/supabase/tasks";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_MODERATION } from "@/lib/vera/taskPrompts";

export async function POST(request, { params }) {
  const { id } = await params;
  const { message, attachment } = await request.json();

  let finalMessage = (message || "").trim();
  let moderated = false;
  if (finalMessage) {
    try {
      const cleaned = await callClaude(TASK_SYSTEM_PROMPT_MODERATION, finalMessage);
      if (cleaned && cleaned.trim() && cleaned.trim() !== finalMessage) {
        finalMessage = cleaned.trim();
        moderated = true;
      }
    } catch (err) {
      // fail open — send the original message if moderation call fails
    }
  }

  const result = await addTaskChat(id, finalMessage, attachment);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json({ ...result, moderated });
}
