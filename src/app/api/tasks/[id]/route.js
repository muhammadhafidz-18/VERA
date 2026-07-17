import { NextResponse } from "next/server";
import { getTaskById, updateTask, deleteTask, pushTaskAudit } from "@/lib/supabase/tasks";

export async function GET(request, { params }) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json({ task });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const changes = [];
  if (body.title !== undefined && body.title !== task.title) changes.push(`title changed to "${body.title}"`);
  if (body.priority !== undefined && body.priority !== task.priority) changes.push(`priority changed to ${body.priority}`);
  if (body.dueDate !== undefined && body.dueDate !== task.dueDate) changes.push(`due date changed`);
  if (body.assignedTo !== undefined && body.assignedTo !== task.assignedTo) changes.push(`reassigned`);
  if (body.description !== undefined && body.description !== task.description) changes.push(`description updated`);

  const result = await updateTask(id, body);
  if (changes.length) await pushTaskAudit(id, "edited", changes.join("; "));

  if (result.success) {
    const refreshed = await getTaskById(id);
    return NextResponse.json({ success: true, task: refreshed });
  }
  return NextResponse.json(result);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const result = await deleteTask(id);
  if (!result.success) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json(result);
}
