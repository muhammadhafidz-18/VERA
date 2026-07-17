import { NextResponse } from "next/server";
import { getBranches, addBranch, deleteBranch, renameBranch } from "@/lib/supabase/directory";

export async function GET() {
  return NextResponse.json({ branches: await getBranches() });
}
export async function POST(request) {
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
  const result = await addBranch(name.trim());
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
export async function PUT(request) {
  const { oldName, newName } = await request.json();
  const result = await renameBranch(oldName, newName.trim());
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
export async function DELETE(request) {
  const { name } = await request.json();
  const result = await deleteBranch(name);
  return NextResponse.json(result);
}
