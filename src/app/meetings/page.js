// src/app/meetings/page.js
"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import MeetingCalendar from "@/components/meetings/MeetingCalendar";
import MeetingFormModal from "@/components/meetings/MeetingFormModal";
import { isoDate } from "@/lib/vera/meetingHelpers";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState("");
  const [editingMeeting, setEditingMeeting] = useState(null);

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
  const upcoming = meetings.filter((m) => m.date >= todayIso).length;

  const handleSave = async (form) => {
    if (editingMeeting) {
      const res = await fetch(`/api/meetings/${encodeURIComponent(editingMeeting.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
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
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setMeetings((list) => [...list, data.meeting]);
    }
    setModalOpen(false);
    setEditingMeeting(null);
  };

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
          onDayClick={(iso) => {
            setEditingMeeting(null);
            setDefaultDate(iso);
            setModalOpen(true);
          }}
          onEventClick={(meeting) => {
            setEditingMeeting(meeting);
            setModalOpen(true);
          }}
        />

        {modalOpen && (
          <MeetingFormModal
            defaultDate={defaultDate}
            initialData={editingMeeting}
            employees={employees}
            onClose={() => {
              setModalOpen(false);
              setEditingMeeting(null);
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
