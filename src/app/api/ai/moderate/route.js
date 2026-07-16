import { NextResponse } from "next/server";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_MODERATION } from "@/lib/vera/taskPrompts";

export async function POST(request) {
  const { text } = await request.json();
  if (!text || !text.trim()) return NextResponse.json({ cleaned: text, changed: false });
  try {
    const cleaned = await callClaude(TASK_SYSTEM_PROMPT_MODERATION, text);
    const trimmed = cleaned && cleaned.trim() ? cleaned.trim() : text;
    return NextResponse.json({ cleaned: trimmed, changed: trimmed !== text.trim() });
  } catch (err) {
    return NextResponse.json({ cleaned: text, changed: false });
  }
}
