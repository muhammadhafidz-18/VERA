// src/components/settings/EditRoleModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";

export default function EditRoleModal({ employee, onClose, onSave }) {
  const [role, setRole] = useState(employee.role);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Edit Role — {employee.name}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Superadmin">Superadmin</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onSave(employee.id, role)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
