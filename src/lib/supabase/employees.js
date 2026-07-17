// src/lib/supabase/employees.js
//
// Looks up an employee profile from the real Supabase `employees` table
// (joined with roles/divisions/branches for display names), matching the
// shape the rest of the app expects from src/lib/vera/store.js's in-memory
// employees array. This is the Supabase-backed replacement for the login
// bridge — once Fase 4 fully migrates the app off the in-memory store,
// this becomes the single source of truth everywhere, not just login.
"use client";
import { createClient } from "./client";

const SELECT = `
  employee_code, name, email, phone, identity_number, address,
  birth_date, join_date, auth_user_id,
  roles ( name ),
  divisions ( name ),
  branches ( name )
`;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.employee_code,
    name: row.name,
    email: row.email,
    role: row.roles?.name || "User",
    division: row.divisions?.name || "-",
    branch: row.branches?.name || "-",
    birthDate: row.birth_date,
    joinDate: row.join_date,
    phone: row.phone,
    identityNumber: row.identity_number,
    address: row.address,
    authUserId: row.auth_user_id,
  };
}

// Preferred lookup — unambiguous, works even if someone changes their email.
export async function fetchEmployeeByAuthUserId(authUserId) {
  const supabase = createClient();
  const { data, error } = await supabase.from("employees").select(SELECT).eq("auth_user_id", authUserId).maybeSingle();
  if (error) {
    console.error("fetchEmployeeByAuthUserId:", error.message);
    return null;
  }
  return mapRow(data);
}

// Fallback — useful right after seeding, before auth_user_id is linked.
export async function fetchEmployeeByEmail(email) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(SELECT)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) {
    console.error("fetchEmployeeByEmail:", error.message);
    return null;
  }
  return mapRow(data);
}
