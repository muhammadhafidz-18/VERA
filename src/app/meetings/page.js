// src/app/meetings/page.js
"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import MeetingCalendar from "@/components/meetings/MeetingCalendar";
import MeetingFormModal from "@/components/meetings/MeetingFormModal";
import MeetingConflictModal from "@/components/meetings/MeetingConflictModal";
import MeetingDayListModal from "@/components/meetings/MeetingDayListModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { isoDate } from "@/lib/vera/meetingHelpers";
import { loadSession } from "@/lib/session";

export default function MeetingsPage() {
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
        <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>Loading...</div>
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
          onEventClick={(meeting) => {
            setEditingMeeting(meeting);
            setModalOpen(true);
          }}
        />

        {dayListDate && (
          <MeetingDayListModal
            date={dayListDate}
            meetings={meetingsForDay}
            currentUserId={currentUserId}
            onClose={() => setDayListDate(null)}
            onSelectMeeting={(m) => {
              setEditingMeeting(m);
              setDayListDate(null);
              setModalOpen(true);
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