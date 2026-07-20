import { NextResponse } from "next/server";
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from "@/lib/supabase/meetings";

export async function GET() {
  return NextResponse.json({ meetings: await getMeetings() });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.title || !body.date || !body.time) {
    return NextResponse.json({ error: "Title, Date, and Time are required." }, { status: 400 });
  }
  const result = await createMeeting(body);
  if (!result.success) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const result = await updateMeeting(id, body);
  if (!result.success) {
    return NextResponse.json(result, { status: result.forbidden ? 403 : 400 });
  }
  return NextResponse.json(result);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const result = await deleteMeeting(id);
  if (!result.success) {
    return NextResponse.json(result, { status: result.forbidden ? 403 : 404 });
  }
  return NextResponse.json(result);
}