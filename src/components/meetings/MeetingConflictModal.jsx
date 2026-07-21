// src/components/meetings/MeetingConflictModal.jsx
import Icon from "@/lib/Icon";

export default function MeetingConflictModal({ meeting, conflicts, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="alert-triangle" size={14} style={{ color: "var(--yellow)" }} /> Schedule Conflict
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
            <b>&ldquo;{meeting?.title}&rdquo;</b> was saved, but it overlaps with{" "}
            {conflicts.length === 1 ? "another meeting" : `${conflicts.length} other meetings`} at the same
            date and time:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {conflicts.map((c, i) => (
              <div
                key={i}
                style={{
                  background: "var(--yellow-s)",
                  border: "1px solid var(--yellow)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                  {c.startTime}–{c.endTime}
                  {c.location ? ` · ${c.location}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}