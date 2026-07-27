// src/components/employees/ColumnSettingsMenu.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";

export const COLUMN_DEFS = [
  { key: "email", label: "Email" },
  { key: "branch", label: "Branch" },
  { key: "division", label: "Division" },
  { key: "joinDate", label: "Join Date" },
  { key: "phone", label: "Phone Number" },
  { key: "status", label: "Status" },
  { key: "resignDate", label: "Resign Date" },
];

export const DEFAULT_VISIBLE_COLUMNS = COLUMN_DEFS.reduce((acc, c) => ({ ...acc, [c.key]: true }), {});

const rowStyle = {
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

export default function ColumnSettingsMenu({ visibleColumns, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (key) => {
    onChange({ ...visibleColumns, [key]: !visibleColumns[key] });
  };

  const hiddenCount = COLUMN_DEFS.filter((c) => !visibleColumns[c.key]).length;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="btn btn-secondary"
        style={{ width: 150, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Columns{hiddenCount > 0 ? ` (-${hiddenCount})` : ""}</span>
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
            right: 0,
            width: 220,
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(16,24,40,.18)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg3)",
              borderBottom: "1px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text2)",
            }}
          >
            Show Columns
          </div>
          <div style={{ padding: "6px 0" }}>
            {COLUMN_DEFS.map((c) => (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                style={rowStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span>{c.label}</span>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${visibleColumns[c.key] ? "var(--accent)" : "var(--border)"}`,
                    background: visibleColumns[c.key] ? "var(--accent)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {visibleColumns[c.key] && <Icon name="check" size={11} style={{ color: "#fff" }} />}
                </span>
              </button>
            ))}
          </div>
          {hiddenCount > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "6px 14px 8px" }}>
              <button
                onClick={() => onChange(DEFAULT_VISIBLE_COLUMNS)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "6px 0",
                }}
              >
                Show all columns
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}