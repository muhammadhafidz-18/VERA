import { NextResponse } from "next/server";
import { callClaude } from "@/lib/vera/claude";
import { TASK_SYSTEM_PROMPT_REFINER } from "@/lib/vera/taskPrompts";

export async function POST(request) {
  const { text } = await request.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "No text to refine." }, { status: 400 });
  try {
    const refined = await callClaude(TASK_SYSTEM_PROMPT_REFINER, `Text to refine:\n\n"${text}"`);
    return NextResponse.json({ refined });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach AI. Please try again." }, { status: 502 });
  }
}
