// src/components/meetings/MeetingFormModal.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";
import TaskAvatar from "@/components/shared/TaskAvatar";

export default function MeetingFormModal({ onClose, onSave, defaultDate, initialData, employees, currentUserId }) {
  const isEditing = !!initialData;
  const canEdit = !isEditing || !initialData.createdBy || initialData.createdBy === currentUserId;

  const [form, setForm] = useState({
    title: initialData?.title || "",
    date: initialData?.date || defaultDate || "",
    time: initialData?.time || "",
    location: initialData?.location || "",
    description: initialData?.description || "",
    attendeeIds: initialData?.attendeeIds || [],
  });
  const [error, setError] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inviteBoxRef = useRef(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const invitedEmployees = form.attendeeIds.map((id) => employees.find((e) => e.id === id)).filter(Boolean);

  const suggestions = employees
    .filter((e) => {
      if (form.attendeeIds.includes(e.id)) return false;
      if (!inviteQuery.trim()) return true;
      const q = inviteQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.division.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    })
    .slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inviteBoxRef.current && !inviteBoxRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addAttendee = (id) => {
    setForm((f) => ({ ...f, attendeeIds: [...f.attendeeIds, id] }));
    setInviteQuery("");
  };
  const removeAttendee = (id) => {
    setForm((f) => ({ ...f, attendeeIds: f.attendeeIds.filter((a) => a !== id) }));
  };

  const handleSave = () => {
    if (!form.title || !form.date || !form.time) {
      setError("Title, Date, and Time are required.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEditing ? "Edit Meeting" : "Add Meeting"}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          {isEditing && !canEdit && (
            <div className="card-note" style={{ marginBottom: 16, background: "var(--yellow-s)", borderColor: "var(--yellow)" }}>
              <Icon name="lock" size={12} style={{ marginRight: 4 }} />
              Only <b>{initialData.createdByName || "the creator"}</b> can edit or delete this meeting. You&apos;re viewing it read-only.
            </div>
          )}

          <div className="form-row">
            <label className="form-label">Title *</label>
            <input className="input" value={form.title} onChange={update("title")} placeholder="Meeting title" disabled={!canEdit} />
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={update("date")} disabled={!canEdit} />
            </div>
            <div>
              <label className="form-label">Time *</label>
              <input type="time" className="input" value={form.time} onChange={update("time")} disabled={!canEdit} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Location</label>
            <input className="input" value={form.location} onChange={update("location")} placeholder="Zoom, Ruang Meeting A, dll" disabled={!canEdit} />
          </div>

          <div className="form-row" ref={inviteBoxRef} style={{ position: "relative" }}>
            <label className="form-label">Invite Member</label>
            {invitedEmployees.length > 0 && (
              <div className="invite-chip-row">
                {invitedEmployees.map((e) => (
                  <span key={e.id} className="invite-chip">
                    <TaskAvatar name={e.name} size={16} />
                    {e.name}
                    {canEdit && (
                      <button type="button" onClick={() => removeAttendee(e.id)}>
                        <Icon name="x" size={10} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {canEdit && (
              <>
                <input
                  className="input"
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type a name or division to invite..."
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="invite-suggest-panel">
                    {suggestions.map((e) => (
                      <button type="button" key={e.id} className="invite-suggest-item" onClick={() => addAttendee(e.id)}>
                        <TaskAvatar name={e.name} size={24} />
                        <div>
                          <div className="invite-suggest-name">{e.name}</div>
                          <div className="invite-suggest-meta">
                            {e.division} · {e.branch}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showSuggestions && inviteQuery.trim() && suggestions.length === 0 && (
                  <div className="invite-suggest-panel">
                    <div className="invite-suggest-empty">No matching employee found.</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={update("description")} placeholder="Agenda or additional notes" disabled={!canEdit} />
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            {canEdit ? "Cancel" : "Close"}
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={handleSave}>
              {isEditing ? "Save Changes" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}