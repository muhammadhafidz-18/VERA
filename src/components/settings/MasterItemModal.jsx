// src/components/settings/MasterItemModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";

export default function MasterItemModal({ title, labelCol, items, initialValue, excludeSelf, onClose, onSave }) {
  const [value, setValue] = useState(initialValue || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(`${labelCol} cannot be empty.`);
      return;
    }
    const isDuplicate = items.some((i) => i.toLowerCase() === trimmed.toLowerCase() && i.toLowerCase() !== (excludeSelf || "").toLowerCase());
    if (isDuplicate) {
      setError(`${labelCol} "${trimmed}" already exists in the list.`);
      return;
    }
    onSave(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">{labelCol} Name</label>
            <input
              className="input"
              value={value}
              autoFocus
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={`Enter ${labelCol.toLowerCase()} name`}
            />
          </div>
          {error && (
            <div className="form-error" style={{ marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
