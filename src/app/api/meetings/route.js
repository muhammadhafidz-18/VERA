import { NextResponse } from "next/server";
import { getMeetings, createMeeting } from "@/lib/supabase/meetings";

export async function GET() {
  return NextResponse.json({ meetings: await getMeetings() });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.title || !body.date || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "Title, Date, Start Time, and End Time are required." }, { status: 400 });
  }
  const result = await createMeeting(body);
  if (!result.success) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}