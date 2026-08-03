// src/app/tasks/page.js
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import TaskIndex from "@/components/tasks/TaskIndex";
import TaskDetailView from "@/components/tasks/TaskDetailView";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";
import { loadSession } from "@/lib/session";
import TasksPageSkeleton from "@/components/shared/skeletons/TasksPageSkeleton";

function TasksPageInner() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(() => loadSession()?.user?.id || null);

  const [view, setView] = useState("index");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);

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

  // If we arrived here from a notification click (?openTask=TSK-xxxx), jump
  // straight into that task's detail view once the task list has loaded.
  useEffect(() => {
    if (loading) return;
    const openTaskId = searchParams.get("openTask");
    if (openTaskId && tasks.some((t) => t.id === openTaskId)) {
      openTask(openTaskId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Poll for new chat messages while a task's detail view is open. There's
  // no Supabase Realtime subscription set up yet — this is a simple,
  // low-effort stand-in so messages from other participants (e.g. sent from
  // another browser/session) show up without a manual page refresh. Runs
  // silently (no loading spinner) so it doesn't interrupt someone mid-type
  // in the chat input below.
  useEffect(() => {
    if (view !== "detail" || !selectedTaskId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(selectedTaskId)}`);
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => prev.map((t) => (t.id === selectedTaskId ? data.task : t)));
        }
      } catch {
        // Silent — a missed poll just means we retry in 4s, no need to
        // surface a network hiccup to the user for a background refresh.
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [view, selectedTaskId]);

  // The task list (`/api/tasks`) only returns a lightweight `{id, isSystem}`
  // shape for each chat message — enough to compute the "can this task be
  // deleted" rule, but missing message text, sender, and timestamp. Opening
  // a task must fetch the full record (`/api/tasks/[id]`, backed by
  // getTaskById which actually JOINs to `employees` for sender name) and
  // merge it in, otherwise every chat bubble renders as "Unknown" with no
  // message and "-" as the time.
  async function openTask(id) {
    setSelectedTaskId(id);
    setView("detail");
    setLoadingTaskDetail(true);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      }
    } finally {
      setLoadingTaskDetail(false);
    }
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
        <TasksPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout hideFloatingChat={view === "detail"}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: "var(--text2)" }}>Submit tasks, complaints, or requests to other divisions.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="btn btn-secondary" href="/tasks/digest">
              <Icon name="file-text" size={13} /> Monthly Digest
            </a>
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
            loadingDetail={loadingTaskDetail}
            onBack={() => setView("index")}
            onUpdateTask={(patch) => updateTask(selectedTask.id, patch)}
            onEditTask={(patch) => handleEditTask(selectedTask, patch)}
            onChangeStatus={(status) => handleChangeStatus(selectedTask, status)}
            onSendChat={(msg, attachment) => handleSendChat(selectedTask.id, msg, attachment)}
            onDeleteTask={() => handleDeleteTask(selectedTask.id)}
          />
        )}

        {showCreateModal && (
          <TaskCreateModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTask}
            employees={employees}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// useSearchParams() requires a Suspense boundary during static generation —
// without this wrapper, `next build` fails even though `next dev` works fine.
export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageSkeleton />}>
      <TasksPageInner />
    </Suspense>
  );
}