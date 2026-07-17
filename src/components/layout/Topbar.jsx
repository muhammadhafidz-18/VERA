// src/components/layout/Topbar.jsx
"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/lib/Icon";
import { PAGE_TITLES, PAGE_PATHS } from "@/lib/constants";
import { taskTimeAgo } from "@/lib/vera/taskUiHelpers";

function keyFromPathname(pathname) {
  const entry = Object.entries(PAGE_PATHS).find(([, path]) => path === pathname);
  return entry ? entry[0] : "command";
}

export default function Topbar({ onLogout }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageKey = keyFromPathname(pathname);
  const [title, sub] = PAGE_TITLES[pageKey];
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []));
  }, [pathname]);

  const sortedNotifications = notifications.slice().sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = sortedNotifications.filter((n) => !n.isRead).length;

  async function markAllNotifRead() {
    const res = await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  async function openNotification(notif) {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: notif.id }) });
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setShowNotifPanel(false);
    if (notif.taskId) router.push(`/tasks?openTask=${encodeURIComponent(notif.taskId)}`);
  }

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">{sub}</div>
      </div>
      <div className="user-badge">
        <div style={{ position: "relative" }}>
          <button className="btn-icon" style={{ position: "relative" }} onClick={() => setShowNotifPanel((v) => !v)}>
            <Icon name="bell" size={15} />
            {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {showNotifPanel && (
            <div className="notif-panel">
              <div className="notif-panel-head">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllNotifRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {sortedNotifications.length === 0 ? (
                <div className="notif-empty">No notifications yet.</div>
              ) : (
                sortedNotifications.map((n) => (
                  <button key={n.id} className={`notif-item${!n.isRead ? " unread" : ""}`} onClick={() => openNotification(n)}>
                    <span className="notif-item-dot" />
                    <div>
                      <div className="notif-item-msg">{n.message}</div>
                      <div className="notif-item-time">{taskTimeAgo(n.createdAt)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <span style={{ fontSize: 13, color: "var(--text2)" }}>
          Vaulthos · <span className="badge gray">superadmin</span>
        </span>
        <div className="user-avatar">VH</div>
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