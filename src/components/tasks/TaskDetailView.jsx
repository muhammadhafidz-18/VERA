// src/components/tasks/TaskDetailView.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";
import TaskAvatar from "@/components/shared/TaskAvatar";
import ConfirmModal from "@/components/shared/ConfirmModal";
import TaskEditModal from "./TaskEditModal";
import TaskRefinePreviewModal from "./TaskRefinePreviewModal";
import TaskAiHistoryModal from "./TaskAiHistoryModal";
import { TASK_STATUS_STYLES, TASK_PRIORITY_STYLES, taskUserById, taskTimeAgo, formatTaskDate } from "@/lib/vera/taskUiHelpers";

async function refineText(text) {
  const res = await fetch("/api/ai/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to refine");
  return data.refined;
}

async function moderateText(text) {
  const res = await fetch("/api/ai/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export default function TaskDetailView({ task, onBack, onUpdateTask, onEditTask, onChangeStatus, onSendChat, onDeleteTask, employees, currentUserId }) {
  const [description, setDescription] = useState(task.description);
  const [refiningDesc, setRefiningDesc] = useState(false);
  const [descError, setDescError] = useState(null);
  const [descRefinePreview, setDescRefinePreview] = useState(null);
  const [moderatingDesc, setModeratingDesc] = useState(false);
  const [descModerationNotice, setDescModerationNotice] = useState(false);

  const [summarizing, setSummarizing] = useState(false);
  const [refiningSummary, setRefiningSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryRefinePreview, setSummaryRefinePreview] = useState(null);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [showSummaryHistory, setShowSummaryHistory] = useState(false);

  const [analyzingIssues, setAnalyzingIssues] = useState(false);
  const [refiningIssueAnalysis, setRefiningIssueAnalysis] = useState(false);
  const [issueAnalysisError, setIssueAnalysisError] = useState(null);
  const [issueRefinePreview, setIssueRefinePreview] = useState(null);
  const [issueHistory, setIssueHistory] = useState([]);
  const [showIssueHistory, setShowIssueHistory] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [chatModerationNotice, setChatModerationNotice] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task.chats.length]);

  useEffect(() => {
    setDescription(task.description);
  }, [task.id]);

  const creator = taskUserById(employees, task.createdBy);
  const assignee = taskUserById(employees, task.assignedTo);
  const p = TASK_PRIORITY_STYLES[task.priority];
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done" && task.status !== "cancelled";
  const summaryCount = task.aiSummaryGenerateCount || 0;
  const issueCount = task.aiIssueAnalysisGenerateCount || 0;

  function saveDescription(next) {
    setDescription(next);
    onUpdateTask({ description: next });
  }

  async function handleDescriptionBlur() {
    if (!description.trim()) return;
    setModeratingDesc(true);
    const { cleaned, changed } = await moderateText(description);
    setModeratingDesc(false);
    if (changed) {
      saveDescription(cleaned);
      setDescModerationNotice(true);
      setTimeout(() => setDescModerationNotice(false), 4000);
    }
  }

  async function handleRefineDescription() {
    setRefiningDesc(true);
    setDescError(null);
    try {
      const refined = await refineText(description);
      setDescRefinePreview(refined);
    } catch (e) {
      setDescError("Failed to reach AI. Please try again.");
    } finally {
      setRefiningDesc(false);
    }
  }

  async function handleGenerateSummary() {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || "Failed to reach AI. Please try again.");
        return;
      }
      if (data.previousSummary) setSummaryHistory((h) => [data.previousSummary, ...h]);
      onUpdateTask({ aiSummary: data.task.aiSummary, aiSummaryGeneratedAt: data.task.aiSummaryGeneratedAt, aiSummaryGenerateCount: data.task.aiSummaryGenerateCount });
    } catch (e) {
      setSummaryError("Failed to reach AI. Please try again.");
    } finally {
      setSummarizing(false);
    }
  }

  async function handleRefineSummary() {
    if (!task.aiSummary) return;
    setRefiningSummary(true);
    setSummaryError(null);
    try {
      const refined = await refineText(task.aiSummary);
      setSummaryRefinePreview(refined);
    } catch (e) {
      setSummaryError("Failed to reach AI. Please try again.");
    } finally {
      setRefiningSummary(false);
    }
  }

  async function handleGenerateIssueAnalysis() {
    setAnalyzingIssues(true);
    setIssueAnalysisError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/issue-analysis`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setIssueAnalysisError(data.error || "Failed to reach AI. Please try again.");
        return;
      }
      if (data.previousAnalysis) setIssueHistory((h) => [data.previousAnalysis, ...h]);
      onUpdateTask({ aiIssueAnalysis: data.task.aiIssueAnalysis, aiIssueAnalysisGeneratedAt: data.task.aiIssueAnalysisGeneratedAt, aiIssueAnalysisGenerateCount: data.task.aiIssueAnalysisGenerateCount });
    } catch (e) {
      setIssueAnalysisError("Failed to reach AI. Please try again.");
    } finally {
      setAnalyzingIssues(false);
    }
  }

  async function handleRefineIssueAnalysis() {
    if (!task.aiIssueAnalysis) return;
    setRefiningIssueAnalysis(true);
    setIssueAnalysisError(null);
    try {
      const refined = await refineText(task.aiIssueAnalysis);
      setIssueRefinePreview(refined);
    } catch (e) {
      setIssueAnalysisError("Failed to reach AI. Please try again.");
    } finally {
      setRefiningIssueAnalysis(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({ name: file.name, dataUrl: reader.result, isImage: file.type.startsWith("image/") });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSend() {
    if (!chatInput.trim() && !pendingAttachment) return;
    const rawMessage = chatInput.trim();
    setChatInput("");
    setSendingChat(true);
    const result = await onSendChat(rawMessage, pendingAttachment);
    if (result?.moderated) {
      setChatModerationNotice(true);
      setTimeout(() => setChatModerationNotice(false), 4000);
    }
    setPendingAttachment(null);
    setSendingChat(false);
  }

  return (
    <div>
      <button onClick={onBack} className="task-back-btn">
        <Icon name="arrow-left" size={14} /> Back
      </button>

      <div className="task-detail-grid">
        {/* LEFT: Task detail */}
        <div className="task-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <select className="task-status-select" value={task.status} onChange={(e) => onChangeStatus(e.target.value)}>
                {Object.entries(TASK_STATUS_STYLES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
              <span className={`badge ${p.badge}`}>{p.label}</span>
              {task.dueDate && (
                <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, color: isOverdue ? "var(--red)" : "var(--text3)", fontWeight: isOverdue ? 600 : 400 }}>
                  <Icon name="calendar" size={11} /> {formatTaskDate(task.dueDate)} {isOverdue && "(Overdue)"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {task.status === "open" && task.chats.filter((c) => !c.isSystem).length === 0 && (
                <button className="btn-icon" title="Delete task" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" size={13} />
                </button>
              )}
              <button className="btn-icon" onClick={() => setShowEditModal(true)}>
                <Icon name="pencil" size={13} />
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{task.title}</h2>

          <div className="task-people-row">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <TaskAvatar name={creator.name} size={22} />
              <span style={{ fontWeight: 500 }}>{creator.name}</span>
            </div>
            <span style={{ color: "var(--text3)" }}>→</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <TaskAvatar name={assignee.name} size={22} />
              <span style={{ fontWeight: 500 }}>{assignee.name}</span>
            </div>
            <span className="badge gray" style={{ marginLeft: "auto" }}>
              {assignee.division}
            </span>
          </div>

          <label className="form-label" style={{ marginTop: 14 }}>
            Description
          </label>
          <textarea className="input" rows={6} value={description} onChange={(e) => saveDescription(e.target.value)} onBlur={handleDescriptionBlur} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <button className="task-ai-link" disabled={refiningDesc || !description.trim()} onClick={handleRefineDescription}>
              {refiningDesc ? <Icon name="refresh" size={12} className="spin" /> : <Icon name="sparkles" size={12} />}
              {refiningDesc ? "Refining..." : "Refine with AI"}
            </button>
            {moderatingDesc && <span style={{ fontSize: 11, color: "var(--text3)" }}>Checking tone...</span>}
            {descModerationNotice && (
              <span style={{ fontSize: 11, color: "var(--purple)" }}>
                <Icon name="sparkles" size={10} /> Adjusted automatically for tone
              </span>
            )}
            {descError && <span style={{ fontSize: 11, color: "var(--red)" }}>{descError}</span>}
          </div>

          <button className="task-activity-toggle" onClick={() => setShowActivityLog((v) => !v)}>
            <Icon name="history" size={12} /> {showActivityLog ? "Hide" : "Show"} Activity Log ({(task.auditLog || []).length})
          </button>
          {showActivityLog && (
            <div className="task-activity-list">
              {(task.auditLog || []).map((log) => {
                const opType = log.action === "created" ? "INSERT" : "UPDATE";
                return (
                  <div key={log.id} className="task-activity-item">
                    <span className={`op-badge ${opType.toLowerCase()}`} style={{ marginTop: 0, marginRight: 6 }}>
                      {opType}
                    </span>
                    <span style={{ fontWeight: 500, color: "var(--text)" }}>{taskUserById(employees, log.byUserId).name}</span>: {log.detail}
                    <span style={{ color: "var(--text3)" }}> · {taskTimeAgo(log.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Chat + AI */}
        <div className="task-panel task-chat-panel">
          <div className="task-ai-card purple">
            <div className="task-ai-card-head">
              <span className="task-ai-card-title purple">
                <Icon name="sparkles" size={12} /> AI Summary
              </span>
              <div className="task-ai-card-actions">
                {summaryHistory.length > 0 && <button onClick={() => setShowSummaryHistory(true)}>History</button>}
                {task.aiSummary && (
                  <button disabled={refiningSummary} onClick={handleRefineSummary}>
                    {refiningSummary ? "Refining..." : "Refine"}
                  </button>
                )}
                <button disabled={summarizing || summaryCount >= 2} onClick={handleGenerateSummary}>
                  {summarizing && <Icon name="refresh" size={11} className="spin" />}
                  {summaryCount >= 2 ? "Limit reached (2/2)" : task.aiSummary ? `Regenerate (${summaryCount}/2)` : `Generate (${summaryCount}/2)`}
                </button>
              </div>
            </div>
            {task.aiSummary ? (
              <>
                <p className="task-ai-card-body">{task.aiSummary}</p>
                <p className="task-ai-card-meta">Generated {taskTimeAgo(task.aiSummaryGeneratedAt)} — AI-generated, still needs review</p>
              </>
            ) : (
              <p className="task-ai-card-placeholder">No summary yet. Click &quot;Generate&quot; to summarize the chat below.</p>
            )}
            {summaryError && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{summaryError}</p>}
          </div>

          <div className="task-ai-card blue">
            <div className="task-ai-card-head">
              <span className="task-ai-card-title blue">
                <Icon name="alert-triangle" size={12} /> Issue Analysis (AI)
              </span>
              <div className="task-ai-card-actions">
                {issueHistory.length > 0 && <button onClick={() => setShowIssueHistory(true)}>History</button>}
                {task.aiIssueAnalysis && (
                  <button disabled={refiningIssueAnalysis} onClick={handleRefineIssueAnalysis}>
                    {refiningIssueAnalysis ? "Refining..." : "Refine"}
                  </button>
                )}
                <button disabled={analyzingIssues || issueCount >= 2} onClick={handleGenerateIssueAnalysis}>
                  {analyzingIssues && <Icon name="refresh" size={11} className="spin" />}
                  {issueCount >= 2 ? "Limit reached (2/2)" : task.aiIssueAnalysis ? `Regenerate (${issueCount}/2)` : `Generate (${issueCount}/2)`}
                </button>
              </div>
            </div>
            {task.aiIssueAnalysis ? (
              <>
                <p className="task-ai-card-body">{task.aiIssueAnalysis}</p>
                <p className="task-ai-card-meta">Generated {taskTimeAgo(task.aiIssueAnalysisGeneratedAt)} — AI-generated, still needs review</p>
              </>
            ) : (
              <p className="task-ai-card-placeholder">Summarize all issues from the description &amp; chat, with status and urgency.</p>
            )}
            {issueAnalysisError && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{issueAnalysisError}</p>}
          </div>

          <div className="task-chat-scroll">
            {task.chats.map((chat) => {
              if (chat.isSystem) {
                return (
                  <div key={chat.id} className="task-chat-system">
                    <div className="task-chat-system-line" />
                    <span className="task-chat-system-pill">
                      <Icon name="check" size={11} /> {chat.message} <span style={{ opacity: 0.6 }}>· {taskTimeAgo(chat.createdAt)}</span>
                    </span>
                    <div className="task-chat-system-line" />
                  </div>
                );
              }
              const sender = taskUserById(employees, chat.senderId);
              const isMine = chat.senderId === currentUserId;
              return (
                <div key={chat.id} className={`task-chat-row${isMine ? " mine" : ""}`}>
                  <TaskAvatar name={sender.name} size={22} />
                  <div className="task-chat-bubble-wrap">
                    {chat.message && <div className={`task-chat-bubble${isMine ? " mine" : ""}`}>{chat.message}</div>}
                    {chat.attachment && (
                      <div className="task-chat-attachment">
                        {chat.attachment.isImage ? (
                          <img src={chat.attachment.dataUrl} alt={chat.attachment.name} />
                        ) : (
                          <a href={chat.attachment.dataUrl} download={chat.attachment.name}>
                            <Icon name="file-text" size={13} /> <span>{chat.attachment.name}</span>
                          </a>
                        )}
                      </div>
                    )}
                    <div className="task-chat-meta">
                      {sender.name} · {taskTimeAgo(chat.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            {task.chats.length === 0 && <div className="task-chat-empty">No messages yet. Start the conversation below.</div>}
            <div ref={chatEndRef} />
          </div>

          {pendingAttachment && (
            <div className="task-pending-attachment">
              {pendingAttachment.isImage ? <img src={pendingAttachment.dataUrl} alt="" /> : <Icon name="file-text" size={15} />}
              <span>{pendingAttachment.name}</span>
              <button onClick={() => setPendingAttachment(null)}>
                <Icon name="x" size={13} />
              </button>
            </div>
          )}

          {chatModerationNotice && (
            <div style={{ fontSize: 11, color: "var(--purple)", display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <Icon name="sparkles" size={10} /> Your last message was adjusted automatically for tone
            </div>
          )}

          <div className="task-chat-input-row">
            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} disabled={sendingChat} />
            <button className="task-chat-icon-btn" onClick={() => fileInputRef.current?.click()} disabled={sendingChat}>
              <Icon name="paperclip" size={15} />
            </button>
            <input
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sendingChat && handleSend()}
              placeholder={sendingChat ? "Checking tone..." : "Type a message..."}
              disabled={sendingChat}
            />
            <button className="task-chat-send-btn" onClick={handleSend} disabled={sendingChat}>
              {sendingChat ? <Icon name="refresh" size={14} className="spin" /> : <Icon name="send" size={14} />}
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete task?"
          message={`"${task.title}" will be permanently deleted. This can't be undone.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDeleteTask();
          }}
        />
      )}

      {showEditModal && (
        <TaskEditModal
          task={task}
          employees={employees}
          currentUserId={currentUserId}
          onClose={() => setShowEditModal(false)}
          onSave={(patch) => {
            onEditTask(patch);
            setShowEditModal(false);
          }}
        />
      )}
      {descRefinePreview && (
        <TaskRefinePreviewModal
          original={description}
          refined={descRefinePreview}
          onApply={() => {
            saveDescription(descRefinePreview);
            setDescRefinePreview(null);
          }}
          onDiscard={() => setDescRefinePreview(null)}
        />
      )}
      {summaryRefinePreview && (
        <TaskRefinePreviewModal
          original={task.aiSummary}
          refined={summaryRefinePreview}
          onApply={() => {
            onUpdateTask({ aiSummary: summaryRefinePreview });
            setSummaryRefinePreview(null);
          }}
          onDiscard={() => setSummaryRefinePreview(null)}
        />
      )}
      {issueRefinePreview && (
        <TaskRefinePreviewModal
          original={task.aiIssueAnalysis}
          refined={issueRefinePreview}
          onApply={() => {
            onUpdateTask({ aiIssueAnalysis: issueRefinePreview });
            setIssueRefinePreview(null);
          }}
          onDiscard={() => setIssueRefinePreview(null)}
        />
      )}
      {showSummaryHistory && (
        <TaskAiHistoryModal
          title="AI Summary"
          history={summaryHistory}
          onRestore={(content) => {
            onUpdateTask({ aiSummary: content, aiSummaryGeneratedAt: Date.now() });
            setShowSummaryHistory(false);
          }}
          onClose={() => setShowSummaryHistory(false)}
        />
      )}
      {showIssueHistory && (
        <TaskAiHistoryModal
          title="Issue Analysis"
          history={issueHistory}
          onRestore={(content) => {
            onUpdateTask({ aiIssueAnalysis: content, aiIssueAnalysisGeneratedAt: Date.now() });
            setShowIssueHistory(false);
          }}
          onClose={() => setShowIssueHistory(false)}
        />
      )}
    </div>
  );
}
