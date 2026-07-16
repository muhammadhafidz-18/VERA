// src/components/tasks/TaskRefinePreviewModal.jsx
import Icon from "@/lib/Icon";

export default function TaskRefinePreviewModal({ original, refined, onApply, onDiscard }) {
  return (
    <div className="modal-overlay" onClick={onDiscard}>
      <div className="modal" style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="sparkles" size={14} style={{ color: "var(--purple)" }} /> AI Refine Preview
          </h3>
          <button className="btn-icon" onClick={onDiscard}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text3)", marginBottom: 6, letterSpacing: 0.3 }}>ORIGINAL</div>
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, fontSize: 12, color: "var(--text2)", maxHeight: 240, overflowY: "auto", whiteSpace: "pre-line" }}>
                {original}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--purple)", marginBottom: 6, letterSpacing: 0.3 }}>AI REFINED RESULT</div>
              <div style={{ background: "var(--purple-s)", border: "1px solid var(--purple)", borderRadius: 8, padding: 10, fontSize: 12, color: "var(--text)", maxHeight: 240, overflowY: "auto", whiteSpace: "pre-line" }}>
                {refined}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text3)" }}>AI output should still be reviewed by a human before applying.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onDiscard}>
            Discard
          </button>
          <button className="btn btn-primary" onClick={onApply}>
            <Icon name="check" size={13} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
