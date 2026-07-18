import { NextResponse } from "next/server";
import { changeTaskStatus } from "@/lib/supabase/tasks";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();
  const result = await changeTaskStatus(id, status);
  if (!result.success) {
    return NextResponse.json(result, { status: result.forbidden ? 403 : 404 });
  }
  return NextResponse.json(result);
}