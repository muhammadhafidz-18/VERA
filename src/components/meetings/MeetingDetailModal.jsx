// src/components/meetings/MeetingDetailModal.jsx
"use client";
import Icon from "@/lib/Icon";
import TaskAvatar from "@/components/shared/TaskAvatar";
import { meetingColor, isMeetingLink, formatMeetingTime12h } from "@/lib/vera/meetingHelpers";

export default function MeetingDetailModal({ meeting, employees, currentUserId, onClose, onEdit, onDelete }) {
  const canManage = !meeting.createdBy || meeting.createdBy === currentUserId;
  const col = meetingColor(meeting.title);

  const dateLabel = meeting.date
    ? new Date(meeting.date + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const guestIds = [...new Set([meeting.createdBy, ...(meeting.attendeeIds || [])].filter(Boolean))];
  const guests = guestIds
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal meeting-detail-card" onClick={(e) => e.stopPropagation()}>
        <div className="meeting-detail-toolbar">
          {canManage && onEdit && (
            <button className="btn-icon" title="Edit meeting" onClick={onEdit}>
              <Icon name="pencil" size={14} />
            </button>
          )}
          {canManage && onDelete && (
            <button className="btn-icon" title="Delete meeting" onClick={onDelete}>
              <Icon name="trash" size={14} />
            </button>
          )}
          <button className="btn-icon" title="Close" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="meeting-detail-body">
          <div className="meeting-detail-head">
            <span className="meeting-detail-dot" style={{ background: col }} />
            <div>
              <div className="meeting-detail-title">{meeting.title}</div>
              <div className="meeting-detail-datetime">
                {dateLabel}
                {meeting.time && ` · ${formatMeetingTime12h(meeting.time)}`}
              </div>
            </div>
          </div>

          {meeting.location && (
            <div className="meeting-detail-row">
              <Icon name={isMeetingLink(meeting.location) ? "video" : "map-pin"} size={15} className="meeting-detail-icon" />
              {isMeetingLink(meeting.location) ? (
                <div style={{ flex: 1 }}>
                  <a href={meeting.location} target="_blank" rel="noopener noreferrer" className="meeting-join-btn">
                    Join Meeting
                  </a>
                  <div className="meeting-link-text">
                    <Icon name="external-link" size={10} /> {meeting.location}
                  </div>
                </div>
              ) : (
                <span>{meeting.location}</span>
              )}
            </div>
          )}

          {meeting.description && (
            <div className="meeting-detail-row">
              <Icon name="file-text" size={15} className="meeting-detail-icon" />
              <span style={{ whiteSpace: "pre-line" }}>{meeting.description}</span>
            </div>
          )}

          {guests.length > 0 && (
            <div className="meeting-detail-row" style={{ alignItems: "flex-start" }}>
              <Icon name="users" size={15} className="meeting-detail-icon" style={{ marginTop: 3 }} />
              <div style={{ flex: 1 }}>
                <div className="meeting-guest-count">{guests.length} guest{guests.length > 1 ? "s" : ""}</div>
                <div className="meeting-guest-list">
                  {guests.map((g) => (
                    <div key={g.id} className="meeting-guest-row">
                      <TaskAvatar name={g.name} size={26} />
                      <div>
                        <div className="meeting-guest-name">{g.name}</div>
                        {g.id === meeting.createdBy && <div className="meeting-guest-role">Organizer</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}