// src/lib/supabase/notifications.js
//
// Unlike the old in-memory version (one global list), task_notifications
// has a required recipient_id — notifications are per-person. Each
// logged-in user only sees their own.
import { createClient } from "./server";
import { getCurrentEmployee } from "./currentUser";

function mapRow(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    message: row.message,
    isRead: row.is_read,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function getNotifications() {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return [];

  const { data, error } = await supabase
    .from("task_notifications")
    .select("id, task_id, message, is_read, created_at")
    .eq("recipient_id", current.uuid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getNotifications:", error.message);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return [];

  await supabase.from("task_notifications").update({ is_read: true }).eq("recipient_id", current.uuid);
  return getNotifications();
}

export async function markNotificationRead(id) {
  const supabase = await createClient();
  await supabase.from("task_notifications").update({ is_read: true }).eq("id", id);
  return getNotifications();
}

// Notifies everyone involved with a task (creator + assignee), skipping
// whoever just performed the action (they don't need to be told about
// their own change).
export async function notifyTaskParticipants(supabase, taskUuid, message, excludeEmployeeUuid) {
  const { data: task } = await supabase.from("tasks").select("created_by, assigned_to").eq("id", taskUuid).single();
  if (!task) return;

  const recipients = [...new Set([task.created_by, task.assigned_to].filter(Boolean))].filter(
    (id) => id !== excludeEmployeeUuid
  );
  if (!recipients.length) return;

  await supabase
    .from("task_notifications")
    .insert(recipients.map((recipient_id) => ({ task_id: taskUuid, recipient_id, message })));
}
