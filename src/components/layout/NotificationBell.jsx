// src/components/layout/NotificationBell.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/lib/Icon";
import { taskTimeAgo } from "@/lib/vera/taskUiHelpers";

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  async function loadNotifications() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  useEffect(() => {
    loadNotifications();
    // Refresh berkala biar badge tetap update walau lagi buka halaman lain.
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const sorted = notifications.slice().sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = sorted.filter((n) => !n.isRead).length;

  async function markAllRead() {
    const res = await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  async function openNotification(notif) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notif.id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setShowPanel(false);
    if (notif.taskId) router.push(`/tasks?open=${encodeURIComponent(notif.taskId)}`);
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="btn-icon" style={{ position: "relative" }} onClick={() => setShowPanel((v) => !v)}>
        <Icon name="bell" size={15} />
        {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {showPanel && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {sorted.length === 0 ? (
            <div className="notif-empty">No notifications yet.</div>
          ) : (
            sorted.map((n) => (
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
  );
}