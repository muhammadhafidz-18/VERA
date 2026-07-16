// src/components/tasks/TaskEditModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import { TASK_PRIORITY_STYLES, CURRENT_USER_ID } from "@/lib/vera/taskUiHelpers";

export default function TaskEditModal({ task, onClose, onSave, employees }) {
  const assignableUsers = employees.filter((e) => e.id !== CURRENT_USER_ID);
  const canReassign = task.createdBy === CURRENT_USER_ID;
  const [title, setTitle] = useState(task.title);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Edit Task</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Task Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
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
          <div className="form-row" style={{ marginBottom: canReassign ? 16 : 4 }}>
            <label className="form-label">To Employee</label>
            <select className="input" value={assignedTo} disabled={!canReassign} onChange={(e) => setAssignedTo(e.target.value)}>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} - {u.name}
                </option>
              ))}
            </select>
          </div>
          {!canReassign && <p style={{ fontSize: 11, color: "var(--text3)" }}>Only the task creator can reassign.</p>}
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!title.trim()}
            onClick={() => onSave({ title, assignedTo, priority, dueDate: dueDate ? new Date(dueDate).getTime() : null })}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
