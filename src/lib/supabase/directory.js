// src/lib/supabase/directory.js
//
// Server-side data access for Employee Directory (employees, divisions,
// branches), backed by the real Supabase tables. Function names/shapes
// mirror src/lib/vera/store.js's in-memory equivalents so the API routes
// under src/app/api/employees and src/app/api/settings can just swap the
// import. Must only be called from server code (route handlers) — uses
// the cookie-based server client, so it runs as the logged-in user and is
// subject to RLS.
import { createClient } from "./server";

function mapEmployeeRow(row) {
  return {
    id: row.employee_code,
    name: row.name,
    email: row.email,
    role: row.roles?.name || "User",
    birthDate: row.birth_date || "",
    division: row.divisions?.name || "",
    branch: row.branches?.name || "",
    joinDate: row.join_date || "",
    phone: row.phone || "",
    identityNumber: row.identity_number || "",
    address: row.address || "",
    authUserId: row.auth_user_id,
  };
}

const EMPLOYEE_SELECT = `
  employee_code, name, email, phone, identity_number, address,
  birth_date, join_date, auth_user_id,
  roles ( name ),
  divisions ( name ),
  branches ( name )
`;

async function nextEmployeeCode(supabase) {
  const { data } = await supabase.from("employees").select("employee_code");
  const nums = (data || [])
    .map((e) => parseInt(String(e.employee_code).replace(/[^0-9]/g, ""), 10))
    .filter((n) => !isNaN(n));
  return `EMP-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
}

async function resolveIdByName(supabase, table, name) {
  if (!name) return null;
  const { data } = await supabase.from(table).select("id").ilike("name", name).maybeSingle();
  return data?.id || null;
}

// Roles are simple enough to auto-create on first use (unlike
// divisions/branches, which are deliberately managed via Settings).
async function resolveOrCreateRoleId(supabase, name) {
  const roleName = name || "User";
  const existing = await resolveIdByName(supabase, "roles", roleName);
  if (existing) return existing;
  const { data, error } = await supabase.from("roles").insert({ name: roleName }).select("id").single();
  if (error) return null;
  return data.id;
}

// ---------- Employees ----------
export async function getEmployees({ search, division, branch } = {}) {
  const supabase = await createClient();
  let query = supabase.from("employees").select(EMPLOYEE_SELECT).order("employee_code");

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_code.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) {
    console.error("getEmployees:", error.message);
    return [];
  }
  let rows = (data || []).map(mapEmployeeRow);
  if (division) rows = rows.filter((e) => e.division.toLowerCase() === division.toLowerCase());
  if (branch) rows = rows.filter((e) => e.branch.toLowerCase() === branch.toLowerCase());
  return rows;
}

export async function createEmployee(input) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("employees")
    .select("id")
    .ilike("email", input.email)
    .maybeSingle();
  if (existing) {
    return { success: false, error: `An employee with email ${input.email} already exists.` };
  }

  const [divisionId, branchId, roleId, employeeCode] = await Promise.all([
    resolveIdByName(supabase, "divisions", input.division),
    resolveIdByName(supabase, "branches", input.branch),
    resolveOrCreateRoleId(supabase, input.role),
    input.id ? Promise.resolve(input.id) : nextEmployeeCode(supabase),
  ]);

  if (input.division && !divisionId) {
    return { success: false, error: `Division "${input.division}" doesn't exist. Add it in Settings first.` };
  }
  if (input.branch && !branchId) {
    return { success: false, error: `Branch "${input.branch}" doesn't exist. Add it in Settings first.` };
  }

  // Create the login account first (if a password was supplied). If this
  // fails (e.g. email already registered in Auth), bail out before writing
  // the employee row so we never end up with a directory entry that has no
  // way to log in.
  let authUserId = null;
  if (input.password) {
    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });
    if (authError) {
      return { success: false, error: `Could not create login account: ${authError.message}` };
    }
    authUserId = authData.user.id;
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_code: employeeCode,
      auth_user_id: authUserId,
      name: input.name,
      email: input.email,
      role_id: roleId,
      birth_date: input.birthDate || null,
      division_id: divisionId,
      branch_id: branchId,
      join_date: input.joinDate || new Date().toISOString().slice(0, 10),
      phone: input.phone || null,
      identity_number: input.identityNumber || null,
      address: input.address || null,
    })
    .select(EMPLOYEE_SELECT)
    .single();

  if (error) {
    if (authUserId) {
      await createAdminClient().auth.admin.deleteUser(authUserId).catch(() => {});
    }
    return { success: false, error: error.message };
  }
  return { success: true, employee: mapEmployeeRow(data) };
}

export async function updateEmployee(id, patch) {
  const supabase = await createClient();

  const update = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.birthDate !== undefined) update.birth_date = patch.birthDate || null;
  if (patch.joinDate !== undefined) update.join_date = patch.joinDate || null;
  if (patch.phone !== undefined) update.phone = patch.phone || null;
  if (patch.identityNumber !== undefined) update.identity_number = patch.identityNumber || null;
  if (patch.address !== undefined) update.address = patch.address || null;
  if (patch.role !== undefined) update.role_id = await resolveOrCreateRoleId(supabase, patch.role);
  if (patch.division !== undefined) update.division_id = await resolveIdByName(supabase, "divisions", patch.division);
  if (patch.branch !== undefined) update.branch_id = await resolveIdByName(supabase, "branches", patch.branch);

  const { data, error } = await supabase
    .from("employees")
    .update(update)
    .eq("employee_code", id)
    .select(EMPLOYEE_SELECT)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: `No employee found with ID ${id}.` };
  return { success: true, employee: mapEmployeeRow(data) };
}

export async function deleteEmployee(id) {
  const supabase = await createClient();
  const { error, count } = await supabase.from("employees").delete({ count: "exact" }).eq("employee_code", id);
  if (error) return { success: false, error: error.message };
  return { success: (count ?? 0) > 0 };
}

// ---------- Divisions ----------
export async function getDivisions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("divisions").select("name").order("name");
  if (error) {
    console.error("getDivisions:", error.message);
    return [];
  }
  return (data || []).map((d) => d.name);
}

export async function addDivision(name) {
  const supabase = await createClient();
  const { error } = await supabase.from("divisions").insert({ name });
  if (error) {
    if (error.code === "23505") return { success: false, error: `Division "${name}" already exists.` };
    return { success: false, error: error.message };
  }
  return { success: true, division: name };
}

export async function deleteDivision(name) {
  const supabase = await createClient();
  const { error } = await supabase.from("divisions").delete().eq("name", name);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function renameDivision(oldName, newName) {
  const supabase = await createClient();
  const { error } = await supabase.from("divisions").update({ name: newName }).eq("name", oldName);
  if (error) {
    if (error.code === "23505") return { success: false, error: `Division "${newName}" already exists.` };
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ---------- Branches ----------
export async function getBranches() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").select("name").order("name");
  if (error) {
    console.error("getBranches:", error.message);
    return [];
  }
  return (data || []).map((b) => b.name);
}

export async function addBranch(name) {
  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({ name });
  if (error) {
    if (error.code === "23505") return { success: false, error: `Branch "${name}" already exists.` };
    return { success: false, error: error.message };
  }
  return { success: true, branch: name };
}

export async function deleteBranch(name) {
  const supabase = await createClient();
  const { error } = await supabase.from("branches").delete().eq("name", name);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function renameBranch(oldName, newName) {
  const supabase = await createClient();
  const { error } = await supabase.from("branches").update({ name: newName }).eq("name", oldName);
  if (error) {
    if (error.code === "23505") return { success: false, error: `Branch "${newName}" already exists.` };
    return { success: false, error: error.message };
  }
  return { success: true };
}
