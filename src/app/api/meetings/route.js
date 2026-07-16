import { NextResponse } from "next/server";
import { getMeetings, createMeeting } from "@/lib/vera/store";

export async function GET() {
  return NextResponse.json({ meetings: getMeetings() });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.title || !body.date || !body.time) {
    return NextResponse.json({ error: "Title, Date, and Time are required." }, { status: 400 });
  }
  const result = createMeeting(body);
  return NextResponse.json(result);
}
