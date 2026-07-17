import { NextResponse } from "next/server";
import { getTasks, createTask } from "@/lib/supabase/tasks";

export async function GET() {
  return NextResponse.json({ tasks: await getTasks() });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.title || !body.assignedTo) {
    return NextResponse.json({ error: "Title and assignee are required." }, { status: 400 });
  }
  const result = await createTask(body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
