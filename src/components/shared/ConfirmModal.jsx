// src/components/shared/ConfirmModal.jsx
import Icon from "@/lib/Icon";

export default function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onCancel}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{message}</div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
