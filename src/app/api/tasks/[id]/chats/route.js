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
      const trimmedCleaned = cleaned ? cleaned.trim() : "";

      if (trimmedCleaned === "[[BLOCKED]]") {
        // Heavily abusive message — don't save it, don't send it to the
        // recipient. Nothing gets written to task_chats for this attempt.
        return NextResponse.json(
          { success: false, blocked: true, error: "Pesan mengandung terlalu banyak kata kasar dan diblokir. Silakan tulis ulang dengan bahasa yang lebih sopan." },
          { status: 422 }
        );
      }

      if (trimmedCleaned && trimmedCleaned !== finalMessage) {
        finalMessage = trimmedCleaned;
        moderated = true;
      }
    } catch (err) {
      // fail open — send the original message if moderation call fails
    }
  }

  const result = await addTaskChat(id, finalMessage, attachment);
  if (!result.success) {
    return NextResponse.json(result, { status: result.forbidden ? 403 : 404 });
  }
  return NextResponse.json({ ...result, moderated });
}