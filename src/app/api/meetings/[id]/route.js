import { NextResponse } from "next/server";
import { updateMeeting, deleteMeeting } from "@/lib/vera/store";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const result = updateMeeting(id, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const result = deleteMeeting(id);
  if (!result.success) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  return NextResponse.json(result);
}
