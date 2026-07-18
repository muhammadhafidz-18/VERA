// src/lib/supabase/meetings.js
import { createClient } from "./server";
import { getCurrentEmployee } from "./currentUser";

const MEETING_SELECT = `
  meeting_code, title, date, time, location, description,
  created_by:employees!meetings_created_by_fkey ( employee_code, name ),
  meeting_attendees ( employees ( employee_code ) )
`;

function mapMeetingRow(row) {
  return {
    id: row.meeting_code,
    title: row.title,
    date: row.date,
    time: (row.time || "").slice(0, 5), // "10:00:00" -> "10:00"
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

export async function getMeetings({ date, search } = {}) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();
  if (!current) return [];

  let query = supabase.from("meetings").select(MEETING_SELECT).order("date").order("time");
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

export async function createMeeting(input) {
  const supabase = await createClient();

  const { data: sameSlot } = await supabase
    .from("meetings")
    .select("title, time, location")
    .eq("date", input.date)
    .eq("time", input.time);
  const conflicts = sameSlot || [];

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
      time: input.time,
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

  return {
    success: true,
    meeting: mapMeetingRow(full),
    schedule_conflict: conflicts.length > 0,
    conflicting_meetings: conflicts.map((m) => ({ title: m.title, time: (m.time || "").slice(0, 5), location: m.location })),
  };
}

export async function updateMeeting(id, patch) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: meetingRow, error: findError } = await supabase
    .from("meetings")
    .select("id, created_by")
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

  const update = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.time !== undefined) update.time = patch.time;
  if (patch.location !== undefined) update.location = patch.location || null;
  if (patch.description !== undefined) update.description = patch.description || null;

  const { error: updateError } = await supabase.from("meetings").update(update).eq("id", meetingRow.id);
  if (updateError) return { success: false, error: updateError.message };

  if (patch.attendeeIds !== undefined) {
    await supabase.from("meeting_attendees").delete().eq("meeting_id", meetingRow.id);
    const attendeeUuids = await resolveEmployeeUuids(supabase, patch.attendeeIds);
    if (attendeeUuids.length) {
      await supabase
        .from("meeting_attendees")
        .insert(attendeeUuids.map((employee_id) => ({ meeting_id: meetingRow.id, employee_id })));
    }
  }

  const { data: full } = await supabase.from("meetings").select(MEETING_SELECT).eq("id", meetingRow.id).single();
  return { success: true, meeting: mapMeetingRow(full) };
}

export async function deleteMeeting(id) {
  const supabase = await createClient();
  const current = await getCurrentEmployee();

  const { data: meetingRow, error: findError } = await supabase
    .from("meetings")
    .select("id, created_by")
    .eq("meeting_code", id)
    .maybeSingle();

  if (findError) return { success: false, error: findError.message };
  if (!meetingRow) return { success: false, error: "Meeting not found." };

  if (meetingRow.created_by && current && meetingRow.created_by !== current.uuid) {
    return { success: false, error: "Only the meeting creator can delete this meeting.", forbidden: true };
  }

  const { error } = await supabase.from("meetings").delete().eq("id", meetingRow.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}