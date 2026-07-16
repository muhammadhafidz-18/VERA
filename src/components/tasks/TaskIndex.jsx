// src/components/tasks/TaskIndex.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { TASK_STATUS_STYLES, TASK_PRIORITY_STYLES, taskUserById, formatTaskDate } from "@/lib/vera/taskUiHelpers";

export default function TaskIndex({ tasks, onOpenTask, onDeleteTask, employees }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);

  const statusCounts = {
    open: tasks.filter((t) => t.status === "open").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };
  const statCardColor = { open: "purple", in_progress: "blue", done: "green", cancelled: "yellow" };

  const filtered = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="stat-grid">
        {Object.entries(TASK_STATUS_STYLES)
          .filter(([key]) => key !== "cancelled")
          .map(([key, s]) => (
            <div key={key} className={`stat-card ${statCardColor[key]}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{statusCounts[key]}</div>
            </div>
          ))}
      </div>

      <div className="filters">
        <div className="input-wrap" style={{ flex: 1, minWidth: 220 }}>
          <span className="input-icon">
            <Icon name="search" size={14} />
          </span>
          <input className="input has-icon" placeholder="Search title or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(TASK_STATUS_STYLES).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 160 }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          {Object.entries(TASK_PRIORITY_STYLES).map(([key, p]) => (
            <option key={key} value={key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>To</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Status</th>
              <th>Messages</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
                  No tasks match this search/filter.
                </td>
              </tr>
            )}
            {filtered.map((t) => {
              const assignee = taskUserById(employees, t.assignedTo);
              const isOverdue = t.dueDate && t.dueDate < Date.now() && t.status !== "done" && t.status !== "cancelled";
              const canDelete = t.status === "open" && t.chats.filter((c) => !c.isSystem).length === 0;
              return (
                <tr key={t.id} onClick={() => onOpenTask(t.id)} style={{ cursor: "pointer" }}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.title}</div>
                    <div style={{ color: "var(--text3)", fontSize: 11.5, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>
                  </td>
                  <td>
                    {assignee.name}
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{assignee.division}</div>
                  </td>
                  <td>
                    <span className={`badge ${TASK_PRIORITY_STYLES[t.priority].badge}`}>{TASK_PRIORITY_STYLES[t.priority].label}</span>
                  </td>
                  <td style={isOverdue ? { color: "var(--red)", fontWeight: 600 } : {}}>
                    {t.dueDate ? formatTaskDate(t.dueDate) : "-"}
                    {isOverdue && " (Overdue)"}
                  </td>
                  <td>
                    <span className={`badge ${TASK_STATUS_STYLES[t.status].badge}`}>{TASK_STATUS_STYLES[t.status].label}</span>
                  </td>
                  <td>{t.chats.length}</td>
                  <td>
                    {canDelete && (
                      <button
                        className="btn-icon"
                        title="Delete task"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteTask(t);
                        }}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmDeleteTask && (
        <ConfirmModal
          title="Delete task?"
          message={`"${confirmDeleteTask.title}" will be permanently deleted. This can't be undone.`}
          onCancel={() => setConfirmDeleteTask(null)}
          onConfirm={() => {
            onDeleteTask(confirmDeleteTask.id);
            setConfirmDeleteTask(null);
          }}
        />
      )}
    </div>
  );
}
