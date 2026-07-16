import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/vera/store";

export async function GET() {
  return NextResponse.json({ employees: getEmployees() });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.id || !body.name || !body.email) {
    return NextResponse.json({ error: "Employee ID, Name, and Email are required." }, { status: 400 });
  }
  const result = createEmployee(body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
