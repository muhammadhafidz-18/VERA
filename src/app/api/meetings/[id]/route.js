import { NextResponse } from "next/server";
import { updateMeeting, deleteMeeting } from "@/lib/supabase/meetings";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const result = await updateMeeting(id, body);
  if (!result.success) {
    const status = result.forbidden ? 403 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const result = await deleteMeeting(id);
  if (!result.success) {
    const status = result.forbidden ? 403 : 404;
    return NextResponse.json({ error: result.error || "Meeting not found." }, { status });
  }
  return NextResponse.json(result);
}