// src/components/employees/EmployeeFilterMenu.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";

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

export default function EmployeeFilterMenu({
  divisions,
  branches,
  divisionFilter,
  branchFilter,
  statusFilter,
  onDivisionChange,
  onBranchChange,
  onStatusChange,
  onReset,
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null); // null | "division" | "branch" | "status"
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

  const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Resigned" },
    { value: "all", label: "All Status" },
  ];

  const activeCount =
    (divisionFilter ? 1 : 0) + (branchFilter ? 1 : 0) + (statusFilter !== "active" ? 1 : 0);

  const SECTIONS = [
    { key: "division", label: "Division", count: divisionFilter ? 1 : 0 },
    { key: "branch", label: "Branch", count: branchFilter ? 1 : 0 },
    { key: "status", label: "Status", count: statusFilter !== "active" ? 1 : 0 },
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

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="btn btn-secondary"
        style={{ width: 150, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => {
          setOpen((v) => !v);
          setSection(null);
        }}
      >
        <span>Filter{activeCount > 0 ? ` (${activeCount})` : ""}</span>
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
                      setOpen(false);
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

          {section === "division" && (
            <div>
              {renderSectionHeader("Division")}
              <div style={{ maxHeight: 260, overflowY: "auto", padding: "6px 0" }}>
                {renderOptionRow("all-div", "All Divisions", !divisionFilter, () => {
                  onDivisionChange("");
                  setOpen(false);
                  setSection(null);
                })}
                {divisions.map((d) =>
                  renderOptionRow(d, d, divisionFilter === d, () => {
                    onDivisionChange(d);
                    setOpen(false);
                    setSection(null);
                  })
                )}
              </div>
            </div>
          )}

          {section === "branch" && (
            <div>
              {renderSectionHeader("Branch")}
              <div style={{ maxHeight: 260, overflowY: "auto", padding: "6px 0" }}>
                {renderOptionRow("all-branch", "All Branches", !branchFilter, () => {
                  onBranchChange("");
                  setOpen(false);
                  setSection(null);
                })}
                {branches.map((b) =>
                  renderOptionRow(b, b, branchFilter === b, () => {
                    onBranchChange(b);
                    setOpen(false);
                    setSection(null);
                  })
                )}
              </div>
            </div>
          )}

          {section === "status" && (
            <div>
              {renderSectionHeader("Status")}
              <div style={{ padding: "6px 0" }}>
                {STATUS_OPTIONS.map((o) =>
                  renderOptionRow(o.value, o.label, statusFilter === o.value, () => {
                    onStatusChange(o.value);
                    setOpen(false);
                    setSection(null);
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