// src/lib/supabase/notifications.js
//
// notifications has a required recipient_id — notifications are per-person.
// Each logged-in user only sees their own. task_id/meeting_id are nullable
// but at least one must be set (enforced by notifications_target_check).
import { createClient } from "./server";
import { getCurrentEmployee } from "./currentUser";

function mapRow(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    taskCode: row.tasks?.task_code || null,
    meetingId: row.meeting_id,
    meetingCode: row.meetings?.meeting_code || null,
    message: row.message,
    isRead: row.is_read,
    createdAt: new Date(row.created_at).getTime(),
  };
}

const NOTIFICATION_SELECT = "id, task_id, meeting_id, message, is_read, created_at, tasks ( task_code ), meetings ( meeting_code )";

export async function getNotifications() {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
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

  await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", current.uuid);
  return getNotifications();
}

export async function markNotificationRead(id) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
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
    .from("notifications")
    .insert(recipients.map((recipient_id) => ({ task_id: taskUuid, recipient_id, message })));
}

// Notifies the meeting's creator + all invited attendees, skipping whoever
// just performed the action.
export async function notifyMeetingParticipants(supabase, meetingUuid, message, excludeEmployeeUuid) {
  const [{ data: meeting }, { data: attendees }] = await Promise.all([
    supabase.from("meetings").select("created_by").eq("id", meetingUuid).maybeSingle(),
    supabase.from("meeting_attendees").select("employee_id").eq("meeting_id", meetingUuid),
  ]);

  const recipients = [
    ...new Set([meeting?.created_by, ...(attendees || []).map((a) => a.employee_id)].filter(Boolean)),
  ].filter((id) => id !== excludeEmployeeUuid);
  if (!recipients.length) return;

  await supabase
    .from("notifications")
    .insert(recipients.map((recipient_id) => ({ meeting_id: meetingUuid, recipient_id, message })));
}