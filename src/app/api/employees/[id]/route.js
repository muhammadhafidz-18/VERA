import { NextResponse } from "next/server";
import { updateEmployee, deleteEmployee } from "@/lib/supabase/directory";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const result = await updateEmployee(id, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const result = await deleteEmployee(id);
  if (!result.success) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json(result);
}
