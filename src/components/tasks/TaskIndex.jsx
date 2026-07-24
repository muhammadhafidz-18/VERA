// src/components/tasks/TaskIndex.jsx
"use client";
import { useState, useMemo, useEffect } from "react";
import Icon from "@/lib/Icon";
import ConfirmModal from "@/components/shared/ConfirmModal";
import Pagination from "@/components/employees/Pagination";
import { PAGE_SIZE } from "@/lib/vera/employeeHelpers";
import { TASK_STATUS_STYLES, TASK_PRIORITY_STYLES, taskUserById, formatTaskDate } from "@/lib/vera/taskUiHelpers";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function endOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function TaskIndex({ tasks, onOpenTask, onDeleteTask, employees }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);

  const statusCounts = {
    open: tasks.filter((t) => t.status === "open").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };
  const statCardColor = { open: "purple", in_progress: "blue", done: "green", cancelled: "yellow" };

  // Only list assignees who actually have at least one task, sorted by name.
  const assigneeOptions = useMemo(() => {
    const ids = new Set(tasks.map((t) => t.assignedTo).filter(Boolean));
    return [...ids]
      .map((id) => taskUserById(employees, id))
      .filter((e) => e && e.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, employees]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    const weekEnd = endOfWeek(today).getTime();

    let rows = tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && t.assignedTo !== assigneeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      }
      if (dueFilter === "overdue") {
        if (!t.dueDate || t.dueDate >= now || t.status === "done" || t.status === "cancelled") return false;
      } else if (dueFilter === "today") {
        if (!t.dueDate || !isSameDay(new Date(t.dueDate), today)) return false;
      } else if (dueFilter === "this_week") {
        if (!t.dueDate || t.dueDate < now || t.dueDate > weekEnd) return false;
      } else if (dueFilter === "no_due_date") {
        if (t.dueDate) return false;
      }
      return true;
    });

    if (sortBy === "due_asc") {
      rows = [...rows].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1; // no due date sinks to the bottom
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
    } else if (sortBy === "priority_desc") {
      rows = [...rows].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    }

    return rows;
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, dueFilter, sortBy, search]);

  // Reset to page 1 whenever the result set changes shape (new filter,
  // new search term, etc.) — otherwise you can get stuck on an empty page.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, assigneeFilter, dueFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasActiveFilters = search || statusFilter || priorityFilter || assigneeFilter || dueFilter || sortBy;

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
        <select className="input" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(TASK_STATUS_STYLES).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 140 }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          {Object.entries(TASK_PRIORITY_STYLES).map(([key, p]) => (
            <option key={key} value={key}>
              {p.label}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 160 }} value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="">All Assignees</option>
          {assigneeOptions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 150 }} value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
          <option value="">All Due Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="this_week">Due This Week</option>
          <option value="no_due_date">No Due Date</option>
        </select>
        <select className="input" style={{ width: 170 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort: Default</option>
          <option value="due_asc">Sort: Due Date (Soonest)</option>
          <option value="priority_desc">Sort: Priority (Highest)</option>
        </select>
        {hasActiveFilters && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setAssigneeFilter("");
              setDueFilter("");
              setSortBy("");
            }}
          >
            Reset
          </button>
        )}
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
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
                  No tasks match this search/filter.
                </td>
              </tr>
            )}
            {paged.map((t) => {
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
        <Pagination page={currentPage} totalPages={totalPages} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
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