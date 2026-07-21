// src/components/meetings/MeetingDayListModal.jsx
"use client";
import Icon from "@/lib/Icon";
import { meetingColor } from "@/lib/vera/meetingHelpers";

export default function MeetingDayListModal({ date, meetings, currentUserId, onClose, onSelectMeeting, onDeleteMeeting, onAddMeeting }) {
  const dateObj = new Date(date + "T00:00:00");
  const label = dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sorted = meetings.slice().sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{label}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          {sorted.length === 0 && (
            <p style={{ fontSize: 12.5, color: "var(--text3)", textAlign: "center", padding: "20px 0" }}>
              No meetings scheduled on this date.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((m) => {
              const col = meetingColor(m.title);
              const canManage = !m.createdBy || m.createdBy === currentUserId;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${col}`,
                    borderRadius: 8,
                    padding: "9px 10px",
                    cursor: "pointer",
                  }}
                  onClick={() => onSelectMeeting(m)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
                      <span style={{ color: col, fontFamily: "'DM Mono',monospace" }}>
                        {m.startTime}–{m.endTime}
                      </span>{" "}
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                      {m.location && <span>{m.location} · </span>}
                      {m.createdByName ? `by ${m.createdByName}` : "creator unknown"}
                    </div>
                  </div>
                  {canManage ? (
                    <button
                      className="btn-icon"
                      style={{ color: "var(--red)", flexShrink: 0 }}
                      title="Delete meeting"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeeting(m);
                      }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  ) : (
                    <Icon name="lock" size={13} style={{ color: "var(--text3)", flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={onAddMeeting}>
            <Icon name="plus" size={13} /> Add Meeting
          </button>
        </div>
      </div>
    </div>
  );
}