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
import { createAdminClient } from "./admin";

const RESIGN_SUFFIX = ".resign";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

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
    status: row.status || "active",
    resignDate: row.resign_date || "",
  };
}

const EMPLOYEE_SELECT = `
  employee_code, name, email, phone, identity_number, address,
  birth_date, join_date, auth_user_id, status, resign_date,
  roles ( name ),
  divisions ( name ),
  branches ( name )
`;

// Atomic — delegates to the `next_employee_code()` Postgres function
// (backed by a sequence), so concurrent inserts can never land on the
// same code. Falls back to the old max+1 scan only if the RPC itself is
// unavailable (e.g. migration not yet run), purely so the app doesn't
// hard-crash — that path still has the original race condition, so run
// the SQL migration before relying on this in production.
async function nextEmployeeCode(supabase) {
  const { data, error } = await supabase.rpc("next_employee_code");
  if (!error && data) return data;

  console.error("nextEmployeeCode (RPC unavailable, falling back to scan):", error?.message);
  const { data: rows } = await supabase.from("employees").select("employee_code");
  const nums = (rows || [])
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
// status: "active" (default) | "inactive" | "all". Defaulting to "active"
// keeps resigned employees out of assignee pickers, meeting attendees,
// exports, etc. everywhere this is called without an explicit status.
// Note: employees with a future resignDate still count as "active" here —
// they only flip once processScheduledResignations() (the daily cron)
// catches up to their date.
export async function getEmployees({ search, division, branch, status = "active" } = {}) {
  const supabase = await createClient();
  let query = supabase.from("employees").select(EMPLOYEE_SELECT).order("employee_code");

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_code.ilike.%${search}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
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

  const [divisionId, branchId, roleId] = await Promise.all([
    resolveIdByName(supabase, "divisions", input.division),
    resolveIdByName(supabase, "branches", input.branch),
    resolveOrCreateRoleId(supabase, input.role),
  ]);

  if (input.division && !divisionId) {
    return { success: false, error: `Division "${input.division}" doesn't exist. Add it in Settings first.` };
  }
  if (input.branch && !branchId) {
    return { success: false, error: `Branch "${input.branch}" doesn't exist. Add it in Settings first.` };
  }

  const usesAutoCode = !input.id;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const employeeCode = input.id || (await nextEmployeeCode(supabase));

    const { data, error } = await supabase
      .from("employees")
      .insert({
        employee_code: employeeCode,
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

    if (!error) return { success: true, employee: mapEmployeeRow(data) };

    const isCodeCollision = error.code === "23505" && error.message.includes("employee_code");

    // We generated this code ourselves and it still collided (extremely
    // rare — e.g. someone manually created an employee with a code the
    // sequence hadn't reached yet). Just ask for a fresh one and retry.
    if (isCodeCollision && usesAutoCode && attempt < MAX_ATTEMPTS) {
      continue;
    }
    // A manually-typed ID collided — surface it to the user instead of
    // silently substituting a different one.
    if (isCodeCollision && !usesAutoCode) {
      return { success: false, error: `Employee ID "${employeeCode}" is already in use.` };
    }
    return { success: false, error: error.message };
  }

  return { success: false, error: "Failed to generate a unique employee ID after several attempts. Please try again." };
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
  if (patch.resignDate !== undefined) update.resign_date = patch.resignDate || null;
  if (patch.role !== undefined) update.role_id = await resolveOrCreateRoleId(supabase, patch.role);
  if (patch.division !== undefined) update.division_id = await resolveIdByName(supabase, "divisions", patch.division);
  if (patch.branch !== undefined) update.branch_id = await resolveIdByName(supabase, "branches", patch.branch);

  // Status transitions auto-manage the ".resign" email suffix, unless the
  // caller explicitly passed a new email in the same request (e.g. editing
  // the profile), in which case we respect that instead.
  if (patch.status !== undefined) {
    update.status = patch.status;

    if (patch.email === undefined) {
      const { data: currentRow } = await supabase
        .from("employees")
        .select("email")
        .eq("employee_code", id)
        .maybeSingle();

      if (currentRow?.email) {
        const isResignedEmail = currentRow.email.endsWith(RESIGN_SUFFIX);
        if (patch.status === "inactive" && !isResignedEmail) {
          update.email = `${currentRow.email}${RESIGN_SUFFIX}`;
        } else if (patch.status === "active" && isResignedEmail) {
          update.email = currentRow.email.slice(0, -RESIGN_SUFFIX.length);
        }
      }
    }
  }

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

// Handles the Employee Directory's "Resign" action for a given date:
// - date is today or in the past  -> resign immediately (status ->
//   inactive, email gets ".resign" appended right away).
// - date is in the future         -> just schedules it. Status stays
//   "active" and the email is untouched; processScheduledResignations()
//   (the daily cron) will flip it automatically once that date arrives.
export async function resignEmployee(id, resignDate) {
  const date = resignDate || todayStr();
  if (date <= todayStr()) {
    return updateEmployee(id, { status: "inactive", resignDate: date });
  }
  return updateEmployee(id, { resignDate: date });
}

// Used both to cancel a still-pending scheduled resignation (status was
// already "active", this just clears resignDate) and to reactivate an
// employee who has already resigned (status -> active, resignDate cleared,
// ".resign" stripped back off the email).
export async function reactivateEmployee(id) {
  return updateEmployee(id, { status: "active", resignDate: null });
}

// Called daily by /api/cron/process-resignations. Finds every employee
// still marked "active" whose scheduled resign_date has arrived (today or
// earlier), and flips them to "inactive" + appends ".resign" to their
// email — the same outcome as an immediate resign, just automatic. Uses
// the admin client since cron requests aren't authenticated as a logged-in
// user (no RLS session to piggyback on).
export async function processScheduledResignations() {
  const admin = createAdminClient();
  const today = todayStr();

  const { data: candidates, error } = await admin
    .from("employees")
    .select("id, employee_code, email, resign_date")
    .eq("status", "active")
    .not("resign_date", "is", null)
    .lte("resign_date", today);

  if (error) {
    console.error("processScheduledResignations:", error.message);
    return { success: false, error: error.message, processed: 0 };
  }
  if (!candidates || candidates.length === 0) {
    return { success: true, processed: 0 };
  }

  let processed = 0;
  for (const emp of candidates) {
    const newEmail = emp.email.endsWith(RESIGN_SUFFIX) ? emp.email : `${emp.email}${RESIGN_SUFFIX}`;
    const { error: updateError } = await admin
      .from("employees")
      .update({ status: "inactive", email: newEmail })
      .eq("id", emp.id);
    if (updateError) {
      console.error(`processScheduledResignations (${emp.employee_code}):`, updateError.message);
      continue;
    }
    processed++;
  }

  return { success: true, processed };
}

// Hard-delete: permanently removes the row (auth_user_id FK is
// "on delete set null" so this doesn't cascade-delete their login, but the
// employee record itself is gone for good). Used by Settings > User
// Management's "Delete" action — NOT by Employee Directory.
export async function deleteEmployee(id) {
  const supabase = await createClient();
  const { error, count } = await supabase.from("employees").delete({ count: "exact" }).eq("employee_code", id);
  if (error) return { success: false, error: error.message };
  return { success: (count ?? 0) > 0 };
}

// Bulk-imports employees from a parsed spreadsheet. Matches existing
// employees by email (case-insensitive) — if found, updates them; if not,
// creates a new one. Never throws: every row failure is captured and
// counted so the caller can report an accurate summary.
export async function bulkImportEmployees(rows) {
  const supabase = await createClient();
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  for (const row of rows) {
    if (!row.name?.trim() || !row.email?.trim()) {
      failed++;
      errors.push({ row, reason: "Missing name or email" });
      continue;
    }
    try {
      const { data: existing } = await supabase
        .from("employees")
        .select("employee_code")
        .ilike("email", row.email.trim())
        .maybeSingle();

      if (existing) {
        const result = await updateEmployee(existing.employee_code, row);
        if (result.success) updated++;
        else {
          failed++;
          errors.push({ row, reason: result.error });
        }
      } else {
        const result = await createEmployee(row);
        if (result.success) created++;
        else {
          failed++;
          errors.push({ row, reason: result.error });
        }
      }
    } catch (err) {
      failed++;
      errors.push({ row, reason: err.message });
    }
  }

  return { total: rows.length, created, updated, failed, errors: errors.slice(0, 10) };
}

// Bulk-imports a simple name-only master list (divisions or branches) from
// a parsed spreadsheet. Existing names (case-insensitive match) are left
// as-is and counted under `updated` since there's nothing else to change;
// new names are inserted.
export async function bulkImportMasterList(target, rows) {
  const table = target === "branches" ? "branches" : "divisions";
  const supabase = await createClient();
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) {
      failed++;
      errors.push({ row, reason: "Missing name" });
      continue;
    }
    try {
      const { data: existing } = await supabase.from(table).select("id").ilike("name", name).maybeSingle();
      if (existing) {
        updated++;
        continue;
      }
      const { error } = await supabase.from(table).insert({ name });
      if (error) {
        failed++;
        errors.push({ row, reason: error.message });
      } else {
        created++;
      }
    } catch (err) {
      failed++;
      errors.push({ row, reason: err.message });
    }
  }

  return { total: rows.length, created, updated, failed, errors: errors.slice(0, 10) };
}

// ---------- Divisions ----------
export async function getDivisionsWithId() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("divisions").select("id, name").order("name");
  if (error) {
    console.error("getDivisionsWithId:", error.message);
    return [];
  }
  return data || [];
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
export async function getBranchesWithId() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").select("id, name").order("name");
  if (error) {
    console.error("getBranchesWithId:", error.message);
    return [];
  }
  return data || [];
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