// src/lib/supabase/tasks.js
import { createClient } from "./server";
import { getCurrentEmployee } from "./currentUser";
import { notifyTaskParticipants } from "./notifications";

const TASK_FIELDS = `
  id, task_code, title, description, status, priority, due_date,
  ai_summary, ai_summary_generated_at, ai_summary_generate_count,
  ai_issue_analysis, ai_issue_analysis_generated_at, ai_issue_analysis_generate_count,
  created_by:employees!tasks_created_by_fkey ( id, employee_code, name ),
  assigned_to:employees!tasks_assigned_to_fkey ( id, employee_code, name )
`;

function mapTaskRow(row, { chats = [], auditLog = [] } = {}) {
  return {
    id: row.task_code,
    title: row.title,
    description: row.description || "",
    createdBy: row.created_by?.employee_code || null,
    assignedTo: row.assigned_to?.employee_code || null,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ? new Date(row.due_date).getTime() : null,
    aiSummary: row.ai_summary || null,
    aiSummaryGeneratedAt: row.ai_summary_generated_at ? new Date(row.ai_summary_generated_at).getTime() : null,
    aiSummaryGenerateCount: row.ai_summary_generate_count || 0,
    aiIssueAnalysis: row.ai_issue_analysis || null,
    aiIssueAnalysisGeneratedAt: row.ai_issue_analysis_generated_at
      ? new Date(row.ai_issue_analysis_generated_at).getTime()
      : null,
    aiIssueAnalysisGenerateCount: row.ai_issue_analysis_generate_count || 0,
    chats,
    auditLog,
    // internal, not part of the original in-memory shape — used by route
    // handlers that need the uuid without a second lookup.
    _uuid: row.id,
  };
}

function mapChatRow(row) {
  return {
    id: row.id,
    senderId: row.employees?.employee_code || null,
    senderName: row.employees?.name || null,
    message: row.message || "",
    attachment: row.attachment_path
      ? { name: row.attachment_name, dataUrl: row.attachment_path, isImage: /\.(png|jpe?g|gif|webp)$/i.test(row.attachment_name || "") }
      : null,
    isSystem: row.is_system,
    action: row.action || null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapAuditRow(row) {
  return {
    id: row.id,
    action: row.action,
    byUserId: row.employees?.employee_code || null,
    detail: row.detail || "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function nextTaskCode(supabase) {
  const { data } = await supabase.from("tasks").select("task_code");
  const nums = (data || [])
    .map((t) => parseInt(String(t.task_code).replace(/[^0-9]/g, ""), 10))
    .filter((n) => !isNaN(n));
  return `TSK-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
}

async function fetchChats(supabase, taskUuid) {
  const { data, error } = await supabase
    .from("task_chats")
    .select("id, message, attachment_path, attachment_name, is_system, action, created_at, employees ( employee_code, name )")
    .eq("task_id", taskUuid)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchChats:", error.message);
    return [];
  }
  return (data || []).map(mapChatRow);
}

async function fetchAuditLog(supabase, taskUuid) {
  const { data, error } = await supabase
    .from("task_audit_log")
    .select("id, action, detail, created_at, employees ( employee_code )")
    .eq("task_id", taskUuid)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchAuditLog:", error.message);
    return [];
  }
  return (data || []).map(mapAuditRow);
}

// A task's two "owners": whoever created it and whoever it's assigned to.
// Mirrors the ownership check pattern used in src/lib/supabase/meetings.js.
function isTaskParticipant(taskRow, current) {
  if (!current) return false;
  return taskRow.created_by === current.uuid || taskRow.assigned_to === current.uuid;
}

// ---------- Reads ----------
export async function getTasks() {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select(`${TASK_FIELDS}, task_chats ( id, is_system )`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTasks:", error.message);
    return [];
  }

  const mapped = (data || []).map((row) =>
    mapTaskRow(row, {
      chats: (row.task_chats || []).map((c) => ({ id: c.id, isSystem: c.is_system })),
    })
  );

  // Mirrors getMeetings(): only tasks the logged-in user is actually
  // involved in — either they created it, or it's assigned to them.
  // Filtered in JS (not via a query-level .or()) since created_by/
  // assigned_to are also used as embedded-resource aliases in TASK_FIELDS;
  // filtering post-fetch avoids any ambiguity with PostgREST there.
  // Without this, every authenticated user could see every task in the
  // company regardless of division, which isn't the intended directory
  // model (task list is per-person, not a global feed).
  return mapped.filter((t) => t.createdBy === current.id || t.assignedTo === current.id);
}

export async function getTaskById(id) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("tasks").select(TASK_FIELDS).eq("task_code", id).maybeSingle();
  if (error || !row) return null;

  const [chats, auditLog] = await Promise.all([fetchChats(supabase, row.id), fetchAuditLog(supabase, row.id)]);
  return mapTaskRow(row, { chats, auditLog });
}

// ---------- Writes ----------
export async function createTask(input) {
  const supabase = await createClient();

  const { data: assignee } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .eq("employee_code", input.assignedTo)
    .maybeSingle();
  if (!assignee) {
    return { success: false, error: `No employee found with ID ${input.assignedTo}.` };
  }

  const current = await getCurrentEmployee();
  const taskCode = await nextTaskCode(supabase);

  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert({
      task_code: taskCode,
      title: input.title,
      description: input.description || null,
      created_by: current?.uuid || null,
      assigned_to: assignee.id,
      status: "open",
      priority: input.priority || "medium",
      due_date: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await supabase.from("task_audit_log").insert({
    task_id: inserted.id,
    action: "created",
    by_user_id: current?.uuid || null,
    detail: "Task created",
  });

  await notifyTaskParticipants(supabase, inserted.id, `Task "${input.title}" created and assigned to ${assignee.name}`, current?.uuid);

  return {
    success: true,
    task: { id: taskCode, title: input.title, assignedTo: assignee.name, priority: input.priority || "medium", dueDate: input.dueDate || null },
  };
}

export async function updateTask(id, patch) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: taskRow, error: findError } = await supabase
    .from("tasks")
    .select("id, created_by, assigned_to")
    .eq("task_code", id)
    .maybeSingle();

  if (findError) return { success: false, error: findError.message };
  if (!taskRow) return { success: false, error: `No task found with ID ${id}.` };

  // Only the creator or the assignee may touch this task at all.
  if (!isTaskParticipant(taskRow, current)) {
    return { success: false, error: "You don't have access to edit this task.", forbidden: true };
  }

  // Reassigning (changing who the task belongs to) is creator-only — mirrors
  // TaskEditModal's canReassign = task.createdBy === currentUserId on the client.
  if (patch.assignedTo !== undefined && taskRow.created_by !== current?.uuid) {
    return { success: false, error: "Only the task creator can reassign this task.", forbidden: true };
  }

  const update = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description || null;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate ? new Date(patch.dueDate).toISOString() : null;
  if (patch.aiSummary !== undefined) update.ai_summary = patch.aiSummary;
  if (patch.aiSummaryGeneratedAt !== undefined)
    update.ai_summary_generated_at = patch.aiSummaryGeneratedAt ? new Date(patch.aiSummaryGeneratedAt).toISOString() : null;
  if (patch.aiSummaryGenerateCount !== undefined) update.ai_summary_generate_count = patch.aiSummaryGenerateCount;
  if (patch.aiIssueAnalysis !== undefined) update.ai_issue_analysis = patch.aiIssueAnalysis;
  if (patch.aiIssueAnalysisGeneratedAt !== undefined)
    update.ai_issue_analysis_generated_at = patch.aiIssueAnalysisGeneratedAt
      ? new Date(patch.aiIssueAnalysisGeneratedAt).toISOString()
      : null;
  if (patch.aiIssueAnalysisGenerateCount !== undefined) update.ai_issue_analysis_generate_count = patch.aiIssueAnalysisGenerateCount;

  if (patch.assignedTo !== undefined) {
    const { data: assignee } = await supabase.from("employees").select("id").eq("employee_code", patch.assignedTo).maybeSingle();
    if (!assignee) return { success: false, error: `No employee found with ID ${patch.assignedTo}.` };
    update.assigned_to = assignee.id;
  }

  const { error } = await supabase.from("tasks").update(update).eq("id", taskRow.id);
  if (error) return { success: false, error: error.message };

  const { data: full } = await supabase.from("tasks").select(TASK_FIELDS).eq("id", taskRow.id).single();
  const [chats, auditLog] = await Promise.all([fetchChats(supabase, taskRow.id), fetchAuditLog(supabase, taskRow.id)]);
  return { success: true, task: mapTaskRow(full, { chats, auditLog }) };
}

export async function deleteTask(id) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: taskRow, error: findError } = await supabase
    .from("tasks")
    .select("id, created_by, status, task_chats ( id, is_system )")
    .eq("task_code", id)
    .maybeSingle();

  if (findError) return { success: false, error: findError.message };
  if (!taskRow) return { success: false, error: "Task not found." };

  // Only the creator may delete a task — mirrors deleteMeeting's ownership check.
  if (taskRow.created_by && current && taskRow.created_by !== current.uuid) {
    return { success: false, error: "Only the task creator can delete this task.", forbidden: true };
  }

  // Same rule TaskIndex.jsx already enforces client-side (canDelete): only
  // deletable while still open and before any real conversation has started.
  // Enforced here too, since the client-side check alone can be bypassed by
  // calling the API directly.
  const hasRealChats = (taskRow.task_chats || []).some((c) => !c.is_system);
  if (taskRow.status !== "open" || hasRealChats) {
    return { success: false, error: "This task can no longer be deleted (it's in progress or already has messages)." };
  }

  const { error, count } = await supabase.from("tasks").delete({ count: "exact" }).eq("id", taskRow.id);
  if (error) return { success: false, error: error.message };
  return { success: (count ?? 0) > 0 };
}

export async function pushTaskAudit(taskCode, action, detail) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  const { data: taskRow } = await supabase.from("tasks").select("id").eq("task_code", taskCode).maybeSingle();
  if (!taskRow) return;
  await supabase
    .from("task_audit_log")
    .insert({ task_id: taskRow.id, action, by_user_id: current?.uuid || null, detail });
}

export async function addTaskChat(taskCode, message, attachment) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return { success: false, error: "Not signed in." };

  const { data: taskRow } = await supabase
    .from("tasks")
    .select("id, title, created_by, assigned_to")
    .eq("task_code", taskCode)
    .maybeSingle();
  if (!taskRow) return { success: false, error: "Task not found." };

  // Only the creator or assignee can post messages on this task.
  if (!isTaskParticipant(taskRow, current)) {
    return { success: false, error: "You don't have access to this task.", forbidden: true };
  }

  const { data: chatRow, error } = await supabase
    .from("task_chats")
    .insert({
      task_id: taskRow.id,
      sender_id: current.uuid,
      message,
      attachment_path: attachment?.dataUrl || null,
      attachment_name: attachment?.name || null,
      is_system: false,
    })
    .select("id, message, attachment_path, attachment_name, is_system, action, created_at")
    .single();

  if (error) return { success: false, error: error.message };

  await notifyTaskParticipants(supabase, taskRow.id, `New message on "${taskRow.title}"`, current.uuid);

  return { success: true, chat: { ...mapChatRow(chatRow), senderId: current.id, senderName: current.name } };
}

export async function changeTaskStatus(taskCode, newStatus) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: taskRow } = await supabase
    .from("tasks")
    .select("id, title, status, created_by, assigned_to")
    .eq("task_code", taskCode)
    .maybeSingle();
  if (!taskRow) return { success: false, error: "Task not found." };

  // Only the creator or assignee can move a task's status.
  if (!isTaskParticipant(taskRow, current)) {
    return { success: false, error: "You don't have access to this task.", forbidden: true };
  }

  if (taskRow.status === newStatus) {
    const { data: full } = await supabase.from("tasks").select(TASK_FIELDS).eq("id", taskRow.id).single();
    const [chats, auditLog] = await Promise.all([fetchChats(supabase, taskRow.id), fetchAuditLog(supabase, taskRow.id)]);
    return { success: true, task: mapTaskRow(full, { chats, auditLog }) };
  }

  const oldLabel = taskRow.status;
  await supabase.from("tasks").update({ status: newStatus }).eq("id", taskRow.id);
  await supabase.from("task_audit_log").insert({
    task_id: taskRow.id,
    action: "status_changed",
    by_user_id: current?.uuid || null,
    detail: `Status changed from "${oldLabel}" to "${newStatus}"`,
  });
  await supabase.from("task_chats").insert({
    task_id: taskRow.id,
    sender_id: null,
    message: `Moved to "${newStatus}"`,
    is_system: true,
    action: "status_changed",
  });
  await notifyTaskParticipants(supabase, taskRow.id, `Status of "${taskRow.title}" changed to ${newStatus}`, current?.uuid);

  const { data: full } = await supabase.from("tasks").select(TASK_FIELDS).eq("id", taskRow.id).single();
  const [chats, auditLog] = await Promise.all([fetchChats(supabase, taskRow.id), fetchAuditLog(supabase, taskRow.id)]);
  return { success: true, task: mapTaskRow(full, { chats, auditLog }) };
}