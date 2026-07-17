// src/lib/supabase/currentUser.js
//
// Resolves the currently logged-in Supabase Auth user (from the request's
// session cookie) to their employee record. Used by server-side task/meeting
// mutations to record who actually performed an action, replacing the old
// hardcoded CURRENT_USER_ID = "EMP-0001".
import { createClient } from "./server";

// Returns both the employees.id (uuid — needed for FK columns like
// created_by/assigned_to/sender_id) and employee_code (the "EMP-0001"
// style id the rest of the app displays), or null if not logged in / not
// yet linked to an employee record.
export async function getCurrentEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_code, name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { uuid: data.id, id: data.employee_code, name: data.name, email: data.email };
}
