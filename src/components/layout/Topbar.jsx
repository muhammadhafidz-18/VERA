// src/components/layout/Topbar.jsx
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/lib/Icon";
import { PAGE_TITLES, PAGE_PATHS } from "@/lib/constants";
import NotificationBell from "./NotificationBell";

function keyFromPathname(pathname) {
  // cari entry di PAGE_PATHS yang path-nya cocok dengan pathname saat ini
  const entry = Object.entries(PAGE_PATHS).find(([key, path]) =>
    pathname === path || pathname.startsWith(path + "/")
  );
  return entry ? entry[0] : "default";
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
        <NotificationBell />
        <div className="user-avatar">{initials(displayName)}</div>
        <button className="logout-btn" title="Logout" onClick={() => setConfirmOpen(true)}>
          <Icon name="logout" size={15} />
        </button>
      </div>

      {/* ...confirmOpen overlay tetap sama */}
    </div>
  );
}