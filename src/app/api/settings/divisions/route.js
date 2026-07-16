import { NextResponse } from "next/server";
import { getDivisions, addDivision, deleteDivision, renameDivision } from "@/lib/vera/store";

export async function GET() {
  return NextResponse.json({ divisions: getDivisions() });
}
export async function POST(request) {
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Division name is required." }, { status: 400 });
  const result = addDivision(name.trim());
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
export async function PUT(request) {
  const { oldName, newName } = await request.json();
  const result = renameDivision(oldName, newName.trim());
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
export async function DELETE(request) {
  const { name } = await request.json();
  const result = deleteDivision(name);
  return NextResponse.json(result);
}
