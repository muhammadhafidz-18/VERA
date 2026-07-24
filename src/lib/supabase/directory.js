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

  if (error) return { success: false, error: error.message };
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

// ---------- Bulk import: Employees (create or update, matched by ID/Email) ----------
export async function bulkImportEmployees(rows) {
  const supabase = await createClient();

  const [{ data: divisionRows }, { data: branchRows }, { data: roleRows }, { data: existingEmployees }] = await Promise.all([
    supabase.from("divisions").select("id, name"),
    supabase.from("branches").select("id, name"),
    supabase.from("roles").select("id, name"),
    supabase.from("employees").select("employee_code, email"),
  ]);

  const divisionMap = new Map((divisionRows || []).map((d) => [d.name.toLowerCase(), d.id]));
  const branchMap = new Map((branchRows || []).map((b) => [b.name.toLowerCase(), b.id]));
  const roleMap = new Map((roleRows || []).map((r) => [r.name.toLowerCase(), r.id]));

  const codeByLower = new Map((existingEmployees || []).map((e) => [e.employee_code.toLowerCase(), e.employee_code]));
  const codeByEmail = new Map((existingEmployees || []).map((e) => [e.email.toLowerCase(), e.employee_code]));

  let nextCodeNum =
    Math.max(
      0,
      ...(existingEmployees || [])
        .map((e) => parseInt(String(e.employee_code).replace(/[^0-9]/g, ""), 10))
        .filter((n) => !isNaN(n))
    ) + 1;

  async function resolveRoleId(roleName) {
    let roleId = roleMap.get(roleName.toLowerCase());
    if (!roleId) {
      const { data: newRole, error } = await supabase.from("roles").insert({ name: roleName }).select("id").single();
      if (!error) {
        roleId = newRole.id;
        roleMap.set(roleName.toLowerCase(), roleId);
      }
    }
    return roleId || null;
  }

  const results = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowLabel = `Row ${i + 2}`;
    const email = (r.email || "").trim().toLowerCase();
    const rawCode = (r.id || "").trim();

    if (!email) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: "Email is required." });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: "Invalid email format." });
      continue;
    }
    if (r.division && !divisionMap.has(r.division.toLowerCase())) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: `Division "${r.division}" doesn't exist.` });
      continue;
    }
    if (r.branch && !branchMap.has(r.branch.toLowerCase())) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: `Branch "${r.branch}" doesn't exist.` });
      continue;
    }

    const existingCode = (rawCode && codeByLower.get(rawCode.toLowerCase())) || codeByEmail.get(email) || null;

    if (existingCode) {
      const update = {};
      if (r.name) update.name = r.name.trim();
      if (r.email) update.email = email;
      if (r.birthDate) update.birth_date = r.birthDate;
      if (r.joinDate) update.join_date = r.joinDate;
      if (r.phone) update.phone = r.phone;
      if (r.identityNumber) update.identity_number = r.identityNumber;
      if (r.address) update.address = r.address;
      if (r.division) update.division_id = divisionMap.get(r.division.toLowerCase());
      if (r.branch) update.branch_id = branchMap.get(r.branch.toLowerCase());
      if (r.role) update.role_id = await resolveRoleId(r.role.trim());

      if (Object.keys(update).length === 0) {
        results.push({ row: rowLabel, email, action: "skipped", success: true, error: null });
        continue;
      }

      const { error } = await supabase.from("employees").update(update).eq("employee_code", existingCode);
      if (error) {
        results.push({ row: rowLabel, email, action: "failed", success: false, error: error.message });
        continue;
      }
      codeByEmail.set(email, existingCode);
      results.push({ row: rowLabel, email, action: "updated", success: true, error: null });
      continue;
    }

    if (!r.name) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: "Name is required for new employees." });
      continue;
    }

    let code = rawCode;
    if (code && codeByLower.has(code.toLowerCase())) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: `Employee ID "${code}" already used.` });
      continue;
    }
    if (!code) {
      code = `EMP-${String(nextCodeNum).padStart(4, "0")}`;
      nextCodeNum++;
    }

    const roleId = await resolveRoleId((r.role || "User").trim());

    const { error } = await supabase.from("employees").insert({
      employee_code: code,
      name: r.name.trim(),
      email,
      role_id: roleId,
      birth_date: r.birthDate || null,
      division_id: r.division ? divisionMap.get(r.division.toLowerCase()) : null,
      branch_id: r.branch ? branchMap.get(r.branch.toLowerCase()) : null,
      join_date: r.joinDate || new Date().toISOString().slice(0, 10),
      phone: r.phone || null,
      identity_number: r.identityNumber || null,
      address: r.address || null,
    });

    if (error) {
      results.push({ row: rowLabel, email, action: "failed", success: false, error: error.message });
      continue;
    }

    codeByLower.set(code.toLowerCase(), code);
    codeByEmail.set(email, code);
    results.push({ row: rowLabel, email, action: "created", success: true, error: null });
  }

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const failed = results.filter((r) => !r.success).length;

  return { success: true, total: rows.length, created, updated, failed, results };
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
export async function getBranches() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").select("name").order("name");
  if (error) {
    console.error("getBranches:", error.message);
    return [];
  }
  return (data || []).map((b) => b.name);
}

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

// ---------- Bulk import: Divisions/Branches (create or rename via ID) ----------
// Matches existing rows by their UUID (the "ID" column from the export
// template). ID filled + matches an existing row -> renames it to
// whatever's in the Name column. ID left blank -> creates a new row. An
// ID that doesn't match anything existing is treated as an error (instead
// of silently creating a new row) so a typo'd ID doesn't sneak in as a
// duplicate.
export async function bulkImportMasterList(kind, rows) {
  const table = kind === "branches" ? "branches" : "divisions";
  const supabase = await createClient();

  const { data: existingRows } = await supabase.from(table).select("id, name");
  const idSet = new Set((existingRows || []).map((r) => r.id));
  const nameLowerToId = new Map((existingRows || []).map((r) => [r.name.toLowerCase(), r.id]));
  const usedNamesLower = new Set((existingRows || []).map((r) => r.name.toLowerCase()));

  const results = [];

  for (let i = 0; i < rows.length; i++) {
    const rowLabel = `Row ${i + 2}`;
    const id = (rows[i].id || "").trim();
    const name = (rows[i].name || "").trim();

    if (!name) {
      results.push({ row: rowLabel, name, action: "failed", success: false, error: "Name is empty." });
      continue;
    }

    if (id) {
      if (!idSet.has(id)) {
        results.push({
          row: rowLabel,
          name,
          action: "failed",
          success: false,
          error: "ID not found — leave the ID column blank to add this as new instead.",
        });
        continue;
      }

      const currentNameLower = [...nameLowerToId.entries()].find(([, v]) => v === id)?.[0];
      const isDuplicate = usedNamesLower.has(name.toLowerCase()) && name.toLowerCase() !== currentNameLower;
      if (isDuplicate) {
        results.push({ row: rowLabel, name, action: "failed", success: false, error: `"${name}" already exists.` });
        continue;
      }

      const { error } = await supabase.from(table).update({ name }).eq("id", id);
      if (error) {
        results.push({ row: rowLabel, name, action: "failed", success: false, error: error.message });
        continue;
      }

      if (currentNameLower) usedNamesLower.delete(currentNameLower);
      usedNamesLower.add(name.toLowerCase());
      nameLowerToId.set(name.toLowerCase(), id);
      results.push({ row: rowLabel, name, action: "updated", success: true, error: null });
      continue;
    }

    if (usedNamesLower.has(name.toLowerCase())) {
      results.push({ row: rowLabel, name, action: "failed", success: false, error: `"${name}" already exists.` });
      continue;
    }

    const { data: inserted, error } = await supabase.from(table).insert({ name }).select("id").single();
    if (error) {
      results.push({ row: rowLabel, name, action: "failed", success: false, error: error.message });
      continue;
    }

    idSet.add(inserted.id);
    usedNamesLower.add(name.toLowerCase());
    nameLowerToId.set(name.toLowerCase(), inserted.id);
    results.push({ row: rowLabel, name, action: "created", success: true, error: null });
  }

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const failed = results.filter((r) => !r.success).length;

  return { success: true, total: rows.length, created, updated, failed, results };
}