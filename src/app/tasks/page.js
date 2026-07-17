// src/app/tasks/page.js
"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import TaskIndex from "@/components/tasks/TaskIndex";
import TaskDetailView from "@/components/tasks/TaskDetailView";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";
import { taskTimeAgo } from "@/lib/vera/taskUiHelpers";
import { loadSession } from "@/lib/session";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(() => loadSession()?.user?.id || null);

  const [view, setView] = useState("index");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    async function load() {
      const [tRes, eRes, nRes] = await Promise.all([
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
        fetch("/api/notifications").then((r) => r.json()),
      ]);
      setTasks(tRes.tasks || []);
      setEmployees(eRes.employees || []);
      setNotifications(nRes.notifications || []);
      setLoading(false);
    }
    load();
  }, []);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const sortedNotifications = notifications.slice().sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = sortedNotifications.filter((n) => !n.isRead).length;

  function openTask(id) {
    setSelectedTaskId(id);
    setView("detail");
  }

  async function refreshNotifications() {
    const data = await fetch("/api/notifications").then((r) => r.json());
    setNotifications(data.notifications || []);
  }

  async function updateTask(id, patch) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function handleChangeStatus(task, newStatus) {
    if (newStatus === task.status) return;
    const res = await fetch(`/api/tasks/${task.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      refreshNotifications();
    }
  }

  async function handleEditTask(task, patch) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      refreshNotifications();
    }
  }

  async function handleSendChat(taskId, message, attachment) {
    const res = await fetch(`/api/tasks/${taskId}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, attachment }),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, chats: [...t.chats, data.chat] } : t)));
      refreshNotifications();
    }
    return data;
  }

  async function handleCreateTask(form) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.error);
      return;
    }
    const tRes = await fetch("/api/tasks").then((r) => r.json());
    setTasks(tRes.tasks || []);
    refreshNotifications();
    setShowCreateModal(false);
    openTask(data.task.id);
  }

  async function handleDeleteTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setNotifications((prev) => prev.filter((n) => n.taskId !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setView("index");
      }
    }
  }

  async function markAllNotifRead() {
    const res = await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  async function openNotification(notif) {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: notif.id }) });
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setShowNotifPanel(false);
    if (notif.taskId) openTask(notif.taskId);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: "var(--text2)" }}>Submit tasks, complaints, or requests to other divisions.</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Icon name="plus" size={13} /> New Task
            </button>
          </div>
        </div>

        {view === "index" && <TaskIndex tasks={tasks} onOpenTask={openTask} onDeleteTask={handleDeleteTask} employees={employees} />}

        {view === "detail" && selectedTask && (
          <TaskDetailView
            task={selectedTask}
            employees={employees}
            currentUserId={currentUserId}
            onBack={() => setView("index")}
            onUpdateTask={(patch) => updateTask(selectedTask.id, patch)}
            onEditTask={(patch) => handleEditTask(selectedTask, patch)}
            onChangeStatus={(status) => handleChangeStatus(selectedTask, status)}
            onSendChat={(msg, attachment) => handleSendChat(selectedTask.id, msg, attachment)}
            onDeleteTask={() => handleDeleteTask(selectedTask.id)}
          />
        )}

        {showCreateModal && (
          <TaskCreateModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateTask} employees={employees} currentUserId={currentUserId} />
        )}
      </div>
    </DashboardLayout>
  );
}
