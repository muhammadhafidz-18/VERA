// src/components/tasks/TaskCreateModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import { TASK_PRIORITY_STYLES, CURRENT_USER_ID } from "@/lib/vera/taskUiHelpers";

export default function TaskCreateModal({ onClose, onCreate, employees }) {
  const assignableUsers = employees.filter((e) => e.id !== CURRENT_USER_ID);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(assignableUsers[0]?.id || "");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>New Task</h3>
          <button className="btn-icon" onClick={onClose}>
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
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!title.trim()}
            onClick={() => onCreate({ title, description, assignedTo, priority, dueDate: dueDate || null })}
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
