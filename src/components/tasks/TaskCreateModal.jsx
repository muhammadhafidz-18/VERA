// src/components/tasks/TaskCreateModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import { TASK_PRIORITY_STYLES } from "@/lib/vera/taskUiHelpers";

export default function TaskCreateModal({ onClose, onCreate, employees, currentUserId }) {
  const assignableUsers = employees.filter((e) => e.id !== currentUserId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(assignableUsers[0]?.id || "");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  // Guards against double/rapid-clicking "Create Task" while the request is
  // still in flight — without this, clicking multiple times (e.g. because
  // the request feels slow, or a prior attempt showed an error) fires a
  // separate onCreate/POST for each click, creating duplicate tasks since
  // the modal only closes after the request actually succeeds.
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting || !title.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ title, description, assignedTo, priority, dueDate: dueDate || null });
    } finally {
      // If onCreate succeeded, the parent unmounts this modal anyway (so this
      // is a no-op). If it failed (e.g. showed an alert), this re-enables
      // the button so the user can fix something and try again — without it,
      // a failed attempt would leave the form permanently stuck disabled.
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={submitting ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>New Task</h3>
          <button className="btn-icon" onClick={onClose} disabled={submitting}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Task Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review vendor contract" />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task details..." />
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(TASK_PRIORITY_STYLES).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">To Employee</label>
            <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} - {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!title.trim() || submitting} onClick={handleSubmit}>
            {submitting ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}