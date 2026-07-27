import { NextResponse } from "next/server";
import { updateEmployee, deleteEmployee, resignEmployee, reactivateEmployee } from "@/lib/supabase/directory";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  // Resign / reactivate go through dedicated functions so the
  // "schedule vs. immediate" and ".resign" email-suffix logic always runs
  // server-side, based on the actual server date — never trusting the
  // client to decide the status directly.
  if (body.action === "resign") {
    const result = await resignEmployee(id, body.resignDate);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json(result);
  }
  if (body.action === "reactivate") {
    const result = await reactivateEmployee(id);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json(result);
  }

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