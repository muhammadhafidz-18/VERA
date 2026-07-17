// src/app/tasks/page.js
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import TaskIndex from "@/components/tasks/TaskIndex";
import TaskDetailView from "@/components/tasks/TaskDetailView";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";
import { loadSession } from "@/lib/session";

function TasksPageInner() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(() => loadSession()?.user?.id || null);

  const [view, setView] = useState("index");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const [tRes, eRes] = await Promise.all([
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);
      setTasks(tRes.tasks || []);
      setEmployees(eRes.employees || []);
      setLoading(false);
    }
    load();
  }, []);

  // Kalau datang dari notifikasi (Topbar -> /tasks?open=TSK-0001), langsung buka task-nya.
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId && tasks.some((t) => t.id === openId)) {
      openTask(openId);
      router.replace("/tasks");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchParams]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  function openTask(id) {
    setSelectedTaskId(id);
    setView("detail");
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
    if (data.success) setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
  }

  async function handleEditTask(task, patch) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.success) setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
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
    setShowCreateModal(false);
    openTask(data.task.id);
  }

  async function handleDeleteTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setView("index");
      }
    }
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
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Icon name="plus" size={13} /> New Task
          </button>
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

export default function TasksPage() {
  // useSearchParams butuh Suspense boundary di App Router.
  return (
    <Suspense fallback={null}>
      <TasksPageInner />
    </Suspense>
  );
}