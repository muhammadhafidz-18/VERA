// src/components/employees/ResignFormModal.jsx
"use client";
import { useState, useMemo } from "react";
import Icon from "@/lib/Icon";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ResignFormModal({ employee, onClose, onConfirm }) {
  const [resignDate, setResignDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);

  const isScheduled = useMemo(() => resignDate > todayStr(), [resignDate]);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(resignDate);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Resign — {employee.name}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 16, lineHeight: 1.5 }}>
            {isScheduled ? (
              <>
                "{employee.name}" ({employee.id}) will stay <b>active</b> until <b>{resignDate}</b> — status and
                email won't change until that date. It'll then automatically switch to resigned/inactive.
              </>
            ) : (
              <>
                "{employee.name}" ({employee.id}) will be marked as resigned/inactive right away. Their record and
                history stay in the system, and you can cancel this later if needed.
              </>
            )}
          </p>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Resign Date</label>
            <input type="date" className="input" value={resignDate} onChange={(e) => setResignDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ background: "var(--red)" }}
            disabled={!resignDate || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Processing…" : isScheduled ? "Schedule Resign" : "Confirm Resign"}
          </button>
        </div>
      </div>
    </div>
  );
}