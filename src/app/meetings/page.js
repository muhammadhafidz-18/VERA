// src/app/meetings/page.js
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import MeetingCalendar from "@/components/meetings/MeetingCalendar";
import MeetingFormModal from "@/components/meetings/MeetingFormModal";
import MeetingConflictModal from "@/components/meetings/MeetingConflictModal";
import MeetingDayListModal from "@/components/meetings/MeetingDayListModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { isoDate } from "@/lib/vera/meetingHelpers";
import { loadSession } from "@/lib/session";
import MeetingsPageSkeleton from "@/components/shared/skeletons/MeetingsPageSkeleton";
import MeetingDetailModal from "@/components/meetings/MeetingDetailModal";

function MeetingsPageInner() {
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(() => loadSession()?.user?.id || null);
  const [onlyMine, setOnlyMine] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState("");
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);

  const [dayListDate, setDayListDate] = useState(null);
  const [confirmDeleteMeeting, setConfirmDeleteMeeting] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);

  useEffect(() => {
    async function load() {
      const [mRes, eRes] = await Promise.all([
        fetch("/api/meetings").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);
      setMeetings(mRes.meetings || []);
      setEmployees(eRes.employees || []);
      setLoading(false);
    }
    load();
  }, []);

  // If we arrived here from a notification click (?openMeeting=MTG-xx), jump
  // straight into that meeting's detail modal once the list has loaded.
  useEffect(() => {
  if (loading) return;
  const openMeetingId = searchParams.get("openMeeting");
  if (openMeetingId) {
    const match = meetings.find((m) => m.id === openMeetingId);
    if (match) setViewingMeeting(match);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading]);

  const todayIso = isoDate(new Date());
  const upcoming = meetings.filter((m) => m && m.date >= todayIso).length;
  const meetingsForDay = dayListDate ? meetings.filter((m) => m.date === dayListDate) : [];

    const handleSave = async (form) => {
    if (editingMeeting) {
      const res = await fetch(`/api/meetings/${encodeURIComponent(editingMeeting.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to save meeting.");
        return;
      }
      setMeetings((list) => list.map((m) => (m.id === editingMeeting.id ? data.meeting : m)));

      if (data.schedule_conflict && data.conflicting_meetings?.length) {
        setConflictInfo({ meeting: data.meeting, conflicts: data.conflicting_meetings });
      }
    } else {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to save meeting.");
        return;
      }
      setMeetings((list) => [...list, data.meeting]);

      if (data.schedule_conflict && data.conflicting_meetings?.length) {
        setConflictInfo({ meeting: data.meeting, conflicts: data.conflicting_meetings });
      }
    }
    setModalOpen(false);
    setEditingMeeting(null);
  };

  async function handleDeleteMeeting(meeting) {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meeting.id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMeetings((list) => list.filter((m) => m.id !== meeting.id));
    } else {
      alert(data.error || "Failed to delete meeting.");
    }
    setConfirmDeleteMeeting(null);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <MeetingsPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 220px)" }}>
          <div className="stat-card blue">
            <div className="stat-label">Upcoming</div>
            <div className="stat-value">{upcoming}</div>
            <div className="stat-sub">Upcoming schedule</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-label">Total tercatat</div>
            <div className="stat-value">{meetings.length}</div>
            <div className="stat-sub">All schedules</div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">Meeting Schedule</div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingMeeting(null);
              setDefaultDate("");
              setModalOpen(true);
            }}
          >
            <Icon name="plus" size={14} /> Add Meeting
          </button>
        </div>

        <MeetingCalendar
          meetings={meetings}
          onDayClick={(iso) => setDayListDate(iso)}
          onEventClick={(meeting) => setViewingMeeting(meeting)}
        />

        {dayListDate && (
          <MeetingDayListModal
            date={dayListDate}
            meetings={meetingsForDay}
            currentUserId={currentUserId}
            onClose={() => setDayListDate(null)}
            onSelectMeeting={(m) => {
              setViewingMeeting(m);
              setDayListDate(null);
            }}
            onDeleteMeeting={(m) => setConfirmDeleteMeeting(m)}
            onAddMeeting={() => {
              setDefaultDate(dayListDate);
              setEditingMeeting(null);
              setDayListDate(null);
              setModalOpen(true);
            }}
          />
        )}

        {modalOpen && (
          <MeetingFormModal
            defaultDate={defaultDate}
            initialData={editingMeeting}
            employees={employees}
            currentUserId={currentUserId}
            onClose={() => {
              setModalOpen(false);
              setEditingMeeting(null);
            }}
            onSave={handleSave}
          />
        )}

        {viewingMeeting && (
          <MeetingDetailModal
            meeting={viewingMeeting}
            employees={employees}
            currentUserId={currentUserId}
            onClose={() => setViewingMeeting(null)}
            onEdit={() => {
              setEditingMeeting(viewingMeeting);
              setDefaultDate("");
              setViewingMeeting(null);
              setModalOpen(true);
            }}
            onDelete={() => {
              setConfirmDeleteMeeting(viewingMeeting);
              setViewingMeeting(null);
            }}
          />
        )}

        {conflictInfo && (
          <MeetingConflictModal
            meeting={conflictInfo.meeting}
            conflicts={conflictInfo.conflicts}
            onClose={() => setConflictInfo(null)}
          />
        )}

        {confirmDeleteMeeting && (
          <ConfirmModal
            title="Delete meeting?"
            message={`"${confirmDeleteMeeting.title}" will be permanently deleted. This can't be undone.`}
            onCancel={() => setConfirmDeleteMeeting(null)}
            onConfirm={() => handleDeleteMeeting(confirmDeleteMeeting)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// useSearchParams() requires a Suspense boundary during static generation —
// without this wrapper, `next build` fails even though `next dev` works fine.
export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsPageSkeleton />}>
      <MeetingsPageInner />
    </Suspense>
  );
}