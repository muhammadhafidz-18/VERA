// src/components/layout/Topbar.jsx
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/lib/Icon";
import { PAGE_TITLES, PAGE_PATHS } from "@/lib/constants";

function keyFromPathname(pathname) {
  const entry = Object.entries(PAGE_PATHS).find(([, path]) => path === pathname);
  return entry ? entry[0] : "command";
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || name[0].toUpperCase();
}

export default function Topbar({ onLogout, user }) {
  const pathname = usePathname();
  const pageKey = keyFromPathname(pathname);
  const [title, sub] = PAGE_TITLES[pageKey];
  const [confirmOpen, setConfirmOpen] = useState(false);

  const displayName = user?.name || "Unknown";
  const displayRole = (user?.role || "user").toLowerCase();

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">{sub}</div>
      </div>
      <div className="user-badge">
        <span style={{ fontSize: 13, color: "var(--text2)" }}>
          {displayName} · <span className="badge gray">{displayRole}</span>
        </span>
        <div className="user-avatar">{initials(displayName)}</div>
        <button className="logout-btn" title="Logout" onClick={() => setConfirmOpen(true)}>
          <Icon name="logout" size={15} />
        </button>
      </div>

      {confirmOpen && (
        <div className="logout-confirm-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="logout-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="logout-confirm-title">Sign out?</div>
            <div className="logout-confirm-sub">You&rsquo;ll be returned to the login page.</div>
            <div className="logout-confirm-actions">
              <button className="logout-cancel-btn" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="logout-confirm-btn" onClick={onLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
