// src/app/api/employees/invite/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });

  const supabase = await createClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, auth_user_id")
    .eq("employee_code", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  if (employee.auth_user_id) {
    return NextResponse.json({ error: "This employee has already been invited." }, { status: 400 });
  }

  const admin = createAdminClient();
  const redirectTo = `${new URL(request.url).origin}/reset-password`;

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(employee.email, { redirectTo });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  // Cukup link-kan auth_user_id — kolom ini sudah ada sejak schema awal,
  // tidak perlu kolom tambahan.
  const { error: updateError } = await supabase
    .from("employees")
    .update({ auth_user_id: data.user.id })
    .eq("id", employee.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}