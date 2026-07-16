// scripts/seed-database.mjs
//
// One-off helper: pushes the current in-memory seed data (employees,
// meetings, tasks, ...) from src/lib/vera/store.js into the real Supabase
// tables defined in supabase/vera_schema.sql. Also links each employee to
// their Supabase Auth account (created earlier via seed-auth-users.mjs) by
// matching on email.
//
// Prerequisites:
//   1. supabase/vera_schema.sql has been run against your project
//      (Supabase Dashboard -> SQL Editor -> paste the file -> Run).
//   2. npm run seed:auth has been run (or accounts created manually) so
//      employees.auth_user_id has something to link to.
//
// Usage:
//   node scripts/seed-database.mjs
//
// Safe to re-run: uses upsert on unique columns (email, employee_code,
// name, meeting_code, task_code) so it won't create duplicates.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

const { employees, meetings, tasks, divisions, branches } = await import("../src/lib/vera/store.js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function fail(step, error) {
  console.error(`\nFAILED at "${step}":`, error.message || error);
  process.exit(1);
}

async function main() {
  // ---------- 1. Divisions & branches ----------
  console.log("Seeding divisions & branches...");
  const { error: divErr } = await supabase
    .from("divisions")
    .upsert(divisions.map((name) => ({ name })), { onConflict: "name" });
  if (divErr) fail("divisions", divErr);

  const { error: branchErr } = await supabase
    .from("branches")
    .upsert(branches.map((name) => ({ name })), { onConflict: "name" });
  if (branchErr) fail("branches", branchErr);

  const { data: divRows, error: divSelErr } = await supabase.from("divisions").select("id, name");
  if (divSelErr) fail("select divisions", divSelErr);
  const divisionMap = Object.fromEntries(divRows.map((d) => [d.name, d.id]));

  const { data: branchRows, error: branchSelErr } = await supabase.from("branches").select("id, name");
  if (branchSelErr) fail("select branches", branchSelErr);
  const branchMap = Object.fromEntries(branchRows.map((b) => [b.name, b.id]));

  // ---------- 2. Roles ----------
  console.log("Seeding roles...");
  const roleNames = [...new Set(employees.map((e) => e.role))];
  const { error: roleErr } = await supabase.from("roles").upsert(
    roleNames.map((name) => ({
      name,
      permissions: name === "Superadmin" ? { can_manage_users: true, can_manage_settings: true } : {},
    })),
    { onConflict: "name" }
  );
  if (roleErr) fail("roles", roleErr);

  const { data: roleRows, error: roleSelErr } = await supabase.from("roles").select("id, name");
  if (roleSelErr) fail("select roles", roleSelErr);
  const roleMap = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));

  // ---------- 3. Employees (linked to Auth accounts by email) ----------
  console.log("Seeding employees...");
  const { data: authList, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) fail("list auth users", authErr);
  const authMap = Object.fromEntries(authList.users.map((u) => [u.email.toLowerCase(), u.id]));

  const missingAuth = employees.filter((e) => !authMap[e.email.toLowerCase()]);
  if (missingAuth.length) {
    console.warn(
      `  warning: ${missingAuth.length} employee(s) have no matching Auth account yet (run "npm run seed:auth" first): ` +
        missingAuth.map((e) => e.email).join(", ")
    );
  }

  const employeeRows = employees.map((e) => ({
    employee_code: e.id,
    auth_user_id: authMap[e.email.toLowerCase()] || null,
    name: e.name,
    email: e.email,
    phone: e.phone || null,
    identity_number: e.identityNumber || null,
    address: e.address || null,
    birth_date: e.birthDate || null,
    join_date: e.joinDate || null,
    role_id: roleMap[e.role] || null,
    division_id: divisionMap[e.division] || null,
    branch_id: branchMap[e.branch] || null,
  }));

  const { error: empErr } = await supabase.from("employees").upsert(employeeRows, { onConflict: "employee_code" });
  if (empErr) fail("employees", empErr);

  const { data: empRows, error: empSelErr } = await supabase.from("employees").select("id, employee_code");
  if (empSelErr) fail("select employees", empSelErr);
  const empMap = Object.fromEntries(empRows.map((e) => [e.employee_code, e.id]));

  // ---------- 4. Meetings ----------
  console.log("Seeding meetings...");
  const meetingRows = meetings.map((m) => ({
    meeting_code: m.id,
    title: m.title,
    date: m.date,
    time: m.time,
    location: m.location || null,
    description: m.description || null,
  }));
  const { error: mtgErr } = await supabase.from("meetings").upsert(meetingRows, { onConflict: "meeting_code" });
  if (mtgErr) fail("meetings", mtgErr);

  const { data: mtgRows, error: mtgSelErr } = await supabase.from("meetings").select("id, meeting_code");
  if (mtgSelErr) fail("select meetings", mtgSelErr);
  const mtgMap = Object.fromEntries(mtgRows.map((m) => [m.meeting_code, m.id]));

  console.log("Seeding meeting attendees...");
  for (const m of meetings) {
    if (!m.attendeeIds?.length) continue;
    const attendeeRows = m.attendeeIds
      .filter((empCode) => empMap[empCode])
      .map((empCode) => ({ meeting_id: mtgMap[m.id], employee_id: empMap[empCode] }));
    if (!attendeeRows.length) continue;
    const { error } = await supabase
      .from("meeting_attendees")
      .upsert(attendeeRows, { onConflict: "meeting_id,employee_id" });
    if (error) fail(`meeting_attendees (${m.id})`, error);
  }

  // ---------- 5. Tasks, chats, audit log ----------
  console.log("Seeding tasks...");
  const taskRows = tasks.map((t) => ({
    task_code: t.id,
    title: t.title,
    description: t.description || null,
    created_by: empMap[t.createdBy] || null,
    assigned_to: empMap[t.assignedTo] || null,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    ai_summary: t.aiSummary || null,
    ai_summary_generated_at: t.aiSummaryGeneratedAt ? new Date(t.aiSummaryGeneratedAt).toISOString() : null,
    ai_summary_generate_count: t.aiSummaryGenerateCount || 0,
    ai_issue_analysis: t.aiIssueAnalysis || null,
    ai_issue_analysis_generated_at: t.aiIssueAnalysisGeneratedAt
      ? new Date(t.aiIssueAnalysisGeneratedAt).toISOString()
      : null,
    ai_issue_analysis_generate_count: t.aiIssueAnalysisGenerateCount || 0,
  }));
  const { error: taskErr } = await supabase.from("tasks").upsert(taskRows, { onConflict: "task_code" });
  if (taskErr) fail("tasks", taskErr);

  const { data: taskRowsBack, error: taskSelErr } = await supabase.from("tasks").select("id, task_code");
  if (taskSelErr) fail("select tasks", taskSelErr);
  const taskMap = Object.fromEntries(taskRowsBack.map((t) => [t.task_code, t.id]));

  console.log("Seeding task chats & audit log...");
  for (const t of tasks) {
    const taskId = taskMap[t.id];
    if (!taskId) continue;

    if (t.chats?.length) {
      const chatRows = t.chats.map((c) => ({
        task_id: taskId,
        sender_id: c.senderId ? empMap[c.senderId] || null : null,
        message: c.message || null,
        is_system: !!c.isSystem,
        action: c.action || null,
        created_at: new Date(c.createdAt).toISOString(),
      }));
      const { error } = await supabase.from("task_chats").insert(chatRows);
      if (error) fail(`task_chats (${t.id})`, error);
    }

    if (t.auditLog?.length) {
      const auditRows = t.auditLog.map((a) => ({
        task_id: taskId,
        action: a.action,
        by_user_id: empMap[a.byUserId] || null,
        detail: a.detail || null,
        created_at: new Date(a.createdAt).toISOString(),
      }));
      const { error } = await supabase.from("task_audit_log").insert(auditRows);
      if (error) fail(`task_audit_log (${t.id})`, error);
    }
  }

  console.log("\nDone. Seeded:");
  console.log(`  ${divisions.length} divisions, ${branches.length} branches, ${roleNames.length} roles`);
  console.log(`  ${employees.length} employees (${employees.length - missingAuth.length} linked to Auth accounts)`);
  console.log(`  ${meetings.length} meetings`);
  console.log(`  ${tasks.length} tasks (with chats & audit log)`);
}

main();
