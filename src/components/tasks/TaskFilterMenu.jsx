// src/components/tasks/TaskFilterMenu.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";
import { TASK_STATUS_STYLES, TASK_PRIORITY_STYLES } from "@/lib/vera/taskUiHelpers";

const rowBaseStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "9px 14px",
  background: "none",
  border: "none",
  textAlign: "left",
  fontSize: 13,
  color: "var(--text)",
  cursor: "pointer",
};

const DUE_OPTIONS = [
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due Today" },
  { value: "this_week", label: "Due This Week" },
  { value: "no_due_date", label: "No Due Date" },
];

const SORT_OPTIONS = [
  { value: "due_asc", label: "Due Date (Soonest)" },
  { value: "priority_desc", label: "Priority (Highest)" },
];

export default function TaskFilterMenu({
  statusFilter,
  priorityFilter,
  assigneeFilter,
  dueFilter,
  sortBy,
  assigneeOptions,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDueChange,
  onSortChange,
  onReset,
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null); // null | "status" | "priority" | "assignee" | "due" | "sort"
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSection(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount =
    (statusFilter ? 1 : 0) +
    (priorityFilter ? 1 : 0) +
    (assigneeFilter ? 1 : 0) +
    (dueFilter ? 1 : 0) +
    (sortBy ? 1 : 0);

  const SECTIONS = [
    { key: "status", label: "Status", count: statusFilter ? 1 : 0 },
    { key: "priority", label: "Priority", count: priorityFilter ? 1 : 0 },
    { key: "assignee", label: "Assignee", count: assigneeFilter ? 1 : 0 },
    { key: "due", label: "Due Date", count: dueFilter ? 1 : 0 },
    { key: "sort", label: "Sort", count: sortBy ? 1 : 0 },
  ];

  const renderOptionRow = (key, label, selected, onClick) => (
    <button
      key={key}
      onClick={onClick}
      style={rowBaseStyle}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {label}
      {selected && <Icon name="check" size={14} style={{ color: "var(--accent)" }} />}
    </button>
  );

  const renderSectionHeader = (label) => (
    <button
      onClick={() => setSection(null)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        padding: "10px 14px",
        background: "var(--bg3)",
        border: "none",
        borderBottom: "1px solid var(--border)",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text)",
        cursor: "pointer",
      }}
    >
      <Icon name="chevron-left" size={13} /> {label}
    </button>
  );

  function closeAll() {
    setOpen(false);
    setSection(null);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="btn btn-secondary"
        style={{ width: 130, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => {
          setOpen((v) => !v);
          setSection(null);
        }}
      >
        <span>
          Filter{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
        <Icon
          name="chevron-right"
          size={13}
          style={{ transform: open ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .15s" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: 240,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(16,24,40,.18)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {section === null && (
            <div style={{ padding: "6px 0" }}>
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  style={{ ...rowBaseStyle, fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span>
                    {s.label}
                    {s.count > 0 && <span style={{ color: "var(--accent)" }}> ({s.count})</span>}
                  </span>
                  <Icon name="chevron-right" size={13} style={{ color: "var(--text3)" }} />
                </button>
              ))}
              {activeCount > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "6px 14px 4px" }}>
                  <button
                    onClick={() => {
                      onReset();
                      closeAll();
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--red)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "6px 0",
                    }}
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {section === "status" && (
            <div>
              {renderSectionHeader("Status")}
              <div style={{ maxHeight: 260, overflowY: "auto", padding: "6px 0" }}>
                {renderOptionRow("all-status", "All Status", !statusFilter, () => {
                  onStatusChange("");
                  closeAll();
                })}
                {Object.entries(TASK_STATUS_STYLES).map(([key, s]) =>
                  renderOptionRow(key, s.label, statusFilter === key, () => {
                    onStatusChange(key);
                    closeAll();
                  })
                )}
              </div>
            </div>
          )}

          {section === "priority" && (
            <div>
              {renderSectionHeader("Priority")}
              <div style={{ maxHeight: 260, overflowY: "auto", padding: "6px 0" }}>
                {renderOptionRow("all-priority", "All Priority", !priorityFilter, () => {
                  onPriorityChange("");
                  closeAll();
                })}
                {Object.entries(TASK_PRIORITY_STYLES).map(([key, p]) =>
                  renderOptionRow(key, p.label, priorityFilter === key, () => {
                    onPriorityChange(key);
                    closeAll();
                  })
                )}
              </div>
            </div>
          )}

          {section === "assignee" && (
            <div>
              {renderSectionHeader("Assignee")}
              <div style={{ maxHeight: 260, overflowY: "auto", padding: "6px 0" }}>
                {renderOptionRow("all-assignee", "All Assignees", !assigneeFilter, () => {
                  onAssigneeChange("");
                  closeAll();
                })}
                {assigneeOptions.map((a) =>
                  renderOptionRow(a.id, a.name, assigneeFilter === a.id, () => {
                    onAssigneeChange(a.id);
                    closeAll();
                  })
                )}
              </div>
            </div>
          )}

          {section === "due" && (
            <div>
              {renderSectionHeader("Due Date")}
              <div style={{ padding: "6px 0" }}>
                {renderOptionRow("all-due", "All Due Dates", !dueFilter, () => {
                  onDueChange("");
                  closeAll();
                })}
                {DUE_OPTIONS.map((o) =>
                  renderOptionRow(o.value, o.label, dueFilter === o.value, () => {
                    onDueChange(o.value);
                    closeAll();
                  })
                )}
              </div>
            </div>
          )}

          {section === "sort" && (
            <div>
              {renderSectionHeader("Sort")}
              <div style={{ padding: "6px 0" }}>
                {renderOptionRow("default-sort", "Default", !sortBy, () => {
                  onSortChange("");
                  closeAll();
                })}
                {SORT_OPTIONS.map((o) =>
                  renderOptionRow(o.value, o.label, sortBy === o.value, () => {
                    onSortChange(o.value);
                    closeAll();
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}