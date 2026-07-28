// src/lib/supabase/meetings.js
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import { getCurrentEmployee } from "./currentUser";
import { notifyMeetingParticipants } from "./notifications";

const MEETING_SELECT = `
  meeting_code, title, date, start_time, end_time, location, description,
  created_by:employees!meetings_created_by_fkey ( employee_code, name ),
  meeting_attendees ( employees ( employee_code ) )
`;

function mapMeetingRow(row) {
  return {
    id: row.meeting_code,
    title: row.title,
    date: row.date,
    startTime: (row.start_time || "").slice(0, 5), // "10:00:00" -> "10:00"
    endTime: (row.end_time || "").slice(0, 5),
    location: row.location || "",
    description: row.description || "",
    createdBy: row.created_by?.employee_code || null,
    createdByName: row.created_by?.name || null,
    attendeeIds: (row.meeting_attendees || []).map((a) => a.employees?.employee_code).filter(Boolean),
  };
}

async function nextMeetingCode(supabase) {
  const { data } = await supabase.from("meetings").select("meeting_code");
  const nums = (data || [])
    .map((m) => parseInt(String(m.meeting_code).replace(/[^0-9]/g, ""), 10))
    .filter((n) => !isNaN(n));
  return `MTG-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0")}`;
}

async function resolveEmployeeUuids(supabase, employeeCodes) {
  if (!employeeCodes?.length) return [];
  const { data } = await supabase.from("employees").select("id, employee_code").in("employee_code", employeeCodes);
  return (data || []).map((e) => e.id);
}

// ---------- Reads ----------
export async function getMeetings({ date, search } = {}) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return [];

  let query = supabase.from("meetings").select(MEETING_SELECT).order("date").order("start_time");
  if (date) query = query.eq("date", date);
  if (search) query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error("getMeetings:", error.message);
    return [];
  }

  return (data || [])
    .map(mapMeetingRow)
    .filter((m) => m.createdBy === current.id || m.attendeeIds.includes(current.id));
}

// ---------- Writes ----------
export async function createMeeting(input) {
  const supabase = await createClient();

  const { data: sameDay } = await supabase
    .from("meetings")
    .select("title, start_time, end_time, location")
    .eq("date", input.date);

  const conflicts = (sameDay || []).filter(
    (m) => input.startTime < m.end_time && input.endTime > m.start_time
  );

  let attendeeCodes = input.attendeeIds || [];
  if (!attendeeCodes.length && input.attendeeNames?.length) {
    const { data: allEmployees } = await supabase.from("employees").select("employee_code, name");
    attendeeCodes = input.attendeeNames
      .map((n) => (allEmployees || []).find((e) => e.name.toLowerCase().includes(n.toLowerCase())))
      .filter(Boolean)
      .map((e) => e.employee_code);
  }

  const current = await getCurrentEmployee();
  const meetingCode = await nextMeetingCode(supabase);

  const { data: inserted, error } = await supabase
    .from("meetings")
    .insert({
      meeting_code: meetingCode,
      title: input.title,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location || null,
      description: input.description || null,
      created_by: current?.uuid || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  const attendeeUuids = await resolveEmployeeUuids(supabase, attendeeCodes);
  if (attendeeUuids.length) {
    await supabase
      .from("meeting_attendees")
      .insert(attendeeUuids.map((employee_id) => ({ meeting_id: inserted.id, employee_id })));
  }

  const { data: full } = await supabase.from("meetings").select(MEETING_SELECT).eq("id", inserted.id).single();

  await notifyMeetingParticipants(
    supabase,
    inserted.id,
    `You've been invited to "${input.title}" on ${input.date} at ${input.startTime}`,
    current?.uuid
  );

  return {
    success: true,
    meeting: mapMeetingRow(full),
    schedule_conflict: conflicts.length > 0,
    conflicting_meetings: conflicts.map((m) => ({
      title: m.title,
      startTime: (m.start_time || "").slice(0, 5),
      endTime: (m.end_time || "").slice(0, 5),
      location: m.location,
    })),
  };
}

export async function updateMeeting(id, patch, options = {}) {
  const { requireConfirmation = false, confirmed = false } = options;
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: meetingRow, error: findError } = await supabase
    .from("meetings")
    .select("id, created_by, date, start_time, end_time")
    .eq("meeting_code", id)
    .maybeSingle();

  if (findError) return { success: false, error: findError.message };
  if (!meetingRow) return { success: false, error: `No meeting found with ID ${id}.` };

  // Meetings created before this feature shipped have created_by = null —
  // treat those as unowned/editable by anyone. Otherwise, only the creator
  // can edit.
  if (meetingRow.created_by && current && meetingRow.created_by !== current.uuid) {
    return { success: false, error: "Only the meeting creator can edit this meeting.", forbidden: true };
  }

  // Check for schedule conflicts using the EFFECTIVE date/time — whatever
  // the patch changes, falling back to the meeting's current values for
  // anything not being changed. Mirrors the same overlap check createMeeting
  // does, excluding this meeting itself from the comparison.
  const effectiveDate = patch.date !== undefined ? patch.date : meetingRow.date;
  const effectiveStart = patch.startTime !== undefined ? patch.startTime : meetingRow.start_time;
  const effectiveEnd = patch.endTime !== undefined ? patch.endTime : meetingRow.end_time;

  const { data: sameDay } = await supabase
    .from("meetings")
    .select("title, start_time, end_time, location")
    .eq("date", effectiveDate)
    .neq("id", meetingRow.id);

  const conflicts = (sameDay || []).filter(
    (m) => effectiveStart < m.end_time && effectiveEnd > m.start_time
  );

  // Only VERA's chat tool sets requireConfirmation — the UI form always
  // saves immediately and shows the conflict warning afterward instead.
  if (requireConfirmation && conflicts.length > 0 && !confirmed) {
    return {
      success: false,
      needs_confirmation: true,
      conflicting_meetings: conflicts.map((m) => ({
        title: m.title,
        startTime: (m.start_time || "").slice(0, 5),
        endTime: (m.end_time || "").slice(0, 5),
        location: m.location,
      })),
      error: "This new time conflicts with existing meetings. Ask the user to confirm before proceeding.",
    };
  }

  const update = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.startTime !== undefined) update.start_time = patch.startTime;
  if (patch.endTime !== undefined) update.end_time = patch.endTime;
  if (patch.location !== undefined) update.location = patch.location || null;
  if (patch.description !== undefined) update.description = patch.description || null;

  const { error: updateError } = await supabase.from("meetings").update(update).eq("id", meetingRow.id);
  if (updateError) return { success: false, error: updateError.message };

  if (patch.attendeeIds !== undefined || patch.attendeeNames !== undefined) {
    let newCodes = patch.attendeeIds || [];
    if (!newCodes.length && patch.attendeeNames?.length) {
      const { data: allEmployees } = await supabase.from("employees").select("employee_code, name");
      newCodes = patch.attendeeNames
        .map((n) => (allEmployees || []).find((e) => e.name.toLowerCase().includes(n.toLowerCase())))
        .filter(Boolean)
        .map((e) => e.employee_code);
    }

    // Additive: "invite X" should add X to the meeting without removing
    // whoever's already invited, so merge with the current attendee list
    // instead of wiping it out.
    const { data: existingRows } = await supabase
      .from("meeting_attendees")
      .select("employees ( employee_code )")
      .eq("meeting_id", meetingRow.id);
    const existingCodes = (existingRows || []).map((r) => r.employees?.employee_code).filter(Boolean);
    const mergedCodes = Array.from(new Set([...existingCodes, ...newCodes]));

    await supabase.from("meeting_attendees").delete().eq("meeting_id", meetingRow.id);
    const attendeeUuids = await resolveEmployeeUuids(supabase, mergedCodes);
    if (attendeeUuids.length) {
      await supabase
        .from("meeting_attendees")
        .insert(attendeeUuids.map((employee_id) => ({ meeting_id: meetingRow.id, employee_id })));
    }
  }

  // Fetch the full row BEFORE using it (this was the bug: `full` was
  // referenced in notifyMeetingParticipants above its declaration).
  const { data: full } = await supabase.from("meetings").select(MEETING_SELECT).eq("id", meetingRow.id).single();

  await notifyMeetingParticipants(
    supabase,
    meetingRow.id,
    `Meeting "${full.title}" was updated (${full.date} ${(full.start_time || "").slice(0, 5)})`,
    current?.uuid
  );

  return {
    success: true,
    meeting: mapMeetingRow(full),
    schedule_conflict: conflicts.length > 0,
    conflicting_meetings: conflicts.map((m) => ({
      title: m.title,
      startTime: (m.start_time || "").slice(0, 5),
      endTime: (m.end_time || "").slice(0, 5),
      location: m.location,
    })),
  };
}

export async function deleteMeeting(id) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: meetingRow, error: findError } = await supabase
    .from("meetings")
    .select("id, title, created_by")
    .eq("meeting_code", id)
    .maybeSingle();

  if (findError) return { success: false, error: findError.message };
  if (!meetingRow) return { success: false, error: "Meeting not found." };

  if (meetingRow.created_by && current && meetingRow.created_by !== current.uuid) {
    return { success: false, error: "Only the meeting creator can delete this meeting.", forbidden: true };
  }

  await notifyMeetingParticipants(
    supabase,
    meetingRow.id,
    `Meeting "${meetingRow.title}" has been cancelled`,
    current?.uuid
  );

  const { error } = await supabase.from("meetings").delete().eq("id", meetingRow.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Upcoming meeting reminders (called by the cron route) ----------
// meetings.date/start_time are stored as plain date/time (no timezone) —
// they represent Asia/Jakarta wall-clock time. We convert to a real UTC
// timestamp here so it can be compared against Date.now().
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, Indonesia has no DST

function meetingStartToUtcMs(dateStr, timeStr) {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  const [y, mo, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, mo - 1, d, h, m) - JAKARTA_OFFSET_MS;
}

export async function notifyUpcomingMeetings() {
  const admin = createAdminClient();
  const now = Date.now();
  const windowEnd = now + 15 * 60 * 1000; // 15-minute lookahead

  const todayStr = new Date(now).toISOString().slice(0, 10);
  const tomorrowStr = new Date(now + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: candidates, error } = await admin
    .from("meetings")
    .select("id, meeting_code, title, date, start_time, location, created_by, reminder_sent_at, meeting_attendees ( employee_id )")
    .in("date", [todayStr, tomorrowStr])
    .is("reminder_sent_at", null);

  if (error) {
    console.error("notifyUpcomingMeetings:", error.message);
    return { success: false, error: error.message, notified: 0 };
  }
  if (!candidates || candidates.length === 0) {
    return { success: true, notified: 0 };
  }

  let notifiedCount = 0;
  for (const meeting of candidates) {
    const startMs = meetingStartToUtcMs(meeting.date, meeting.start_time);
    // Skip meetings not yet inside the 15-minute window, and meetings
    // that already started (missed window — don't send a late reminder).
    if (startMs < now || startMs > windowEnd) continue;

    const recipients = [
      ...new Set([meeting.created_by, ...(meeting.meeting_attendees || []).map((a) => a.employee_id)].filter(Boolean)),
    ];

    const minutesLeft = Math.max(1, Math.round((startMs - now) / 60000));
    const message = `Meeting "${meeting.title}" (${meeting.meeting_code}) starts in ${minutesLeft} minute${
      minutesLeft === 1 ? "" : "s"
    }${meeting.location ? ` at ${meeting.location}` : ""}.`;

    if (recipients.length) {
      const { error: insertError } = await admin
        .from("notifications")
        .insert(recipients.map((recipient_id) => ({ meeting_id: meeting.id, recipient_id, message })));
      if (insertError) {
        console.error(`notifyUpcomingMeetings (${meeting.meeting_code}):`, insertError.message);
        continue;
      }
    }

    await admin.from("meetings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", meeting.id);
    notifiedCount++;
  }

  return { success: true, notified: notifiedCount };
}