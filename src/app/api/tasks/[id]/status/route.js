import { NextResponse } from "next/server";
import { changeTaskStatus } from "@/lib/vera/store";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();
  const result = changeTaskStatus(id, status);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result);
}
