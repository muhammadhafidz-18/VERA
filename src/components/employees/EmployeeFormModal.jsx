// src/components/employees/EmployeeFormModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";

export default function EmployeeFormModal({ initialData, onClose, onSave, divisions, branches }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData || {
      id: "",
      name: "",
      email: "",
      birthDate: "",
      joinDate: "",
      branch: branches[0],
      division: divisions[0],
      phone: "",
      identityNumber: "",
      address: "",
    }
  );
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    if (!form.id || !form.name || !form.email) {
      setError("Employee ID, Name, and Email are required.");
      return;
    }
    onSave(form, isEdit);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? "Edit Employee" : "Add Employee"}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row two">
            <div>
              <label className="form-label">Employee ID *</label>
              <input className="input" value={form.id} onChange={update("id")} placeholder="EMP-0016" disabled={isEdit} />
            </div>
            <div>
              <label className="form-label">Name *</label>
              <input className="input" value={form.name} onChange={update("name")} placeholder="Full name" />
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={update("email")} placeholder="nama@vaulthos.com" />
            </div>
            <div>
              <label className="form-label">Birthdate</label>
              <input type="date" className="input" value={form.birthDate} onChange={update("birthDate")} />
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Join Date</label>
              <input type="date" className="input" value={form.joinDate} onChange={update("joinDate")} />
            </div>
            <div>
              <label className="form-label">Branch</label>
              <select className="input" value={form.branch} onChange={update("branch")}>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Division</label>
              <select className="input" value={form.division} onChange={update("division")}>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="input" value={form.phone} onChange={update("phone")} placeholder="0812xxxxxxxx" />
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Identity Number</label>
              <input type="number" className="input" value={form.identityNumber} onChange={update("identityNumber")} placeholder="16 digit NIK" />
            </div>
            <div></div>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Domisili Address</label>
            <textarea className="form-textarea" value={form.address} onChange={update("address")} placeholder="Full residential address" />
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? "Save Changes" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
