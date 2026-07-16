// src/components/tasks/TaskAiHistoryModal.jsx
import Icon from "@/lib/Icon";
import { taskTimeAgo } from "@/lib/vera/taskUiHelpers";

export default function TaskAiHistoryModal({ title, history, onRestore, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="history" size={14} /> {title} History
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          {history.length === 0 && <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: "20px 0" }}>No history yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h) => (
              <div key={h.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, color: "var(--text3)" }}>{taskTimeAgo(h.createdAt)}</span>
                  <button
                    style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                    onClick={() => onRestore(h.content)}
                  >
                    Use this version
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "var(--text2)", whiteSpace: "pre-line" }}>{h.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
