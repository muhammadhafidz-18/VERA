// src/components/employees/EmployeeFormModal.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";

function nextEmployeeId(employees) {
  const nums = employees
    .map((e) => parseInt(String(e.id).replace(/[^0-9]/g, ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `EMP-${String(next).padStart(4, "0")}`;
}

export default function EmployeeFormModal({ initialData, onClose, onSave, divisions, branches, employees = [] }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData || {
      id: nextEmployeeId(employees),
      name: "",
      email: "",
      role: "User",
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

    const trimmedEmail = form.email.trim().toLowerCase();
    const isDuplicateEmail = employees.some(
      (e) => e.email.toLowerCase() === trimmedEmail && (!isEdit || e.id !== form.id)
    );
    if (isDuplicateEmail) {
      setError(`Email "${form.email}" is already used by another employee.`);
      return;
    }

    const isDuplicateId = employees.some((e) => e.id.toLowerCase() === form.id.trim().toLowerCase() && (!isEdit || e.id !== initialData.id));
    if (isDuplicateId) {
      setError(`Employee ID "${form.id}" is already used by another employee.`);
      return;
    }

    setError("");
    onSave({ ...form, id: form.id.trim() }, isEdit);
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
          {!isEdit && (
            <div className="card-note" style={{ marginBottom: 16 }}>
              This employee won&rsquo;t be able to log in yet. After saving, go to <b>Settings → User Management</b> and click <b>Invite</b> to send them a login setup email.
            </div>
          )}

          <div className="form-row two">
            <div>
              <label className="form-label">Employee ID *</label>
              <input
                className="input"
                value={form.id}
                onChange={update("id")}
                placeholder="EMP-0016"
                disabled={isEdit}
              />
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
              <label className="form-label">Role</label>
              <select className="input" value={form.role} onChange={update("role")}>
                <option value="User">User</option>
                <option value="Superadmin">Superadmin</option>
              </select>
            </div>
          </div>

          <div className="form-row two">
            <div>
              <label className="form-label">Birthdate</label>
              <input type="date" className="input" value={form.birthDate} onChange={update("birthDate")} />
            </div>
            <div>
              <label className="form-label">Join Date</label>
              <input type="date" className="input" value={form.joinDate} onChange={update("joinDate")} />
            </div>
          </div>
          <div className="form-row two">
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
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Phone Number</label>
              <input className="input" value={form.phone} onChange={update("phone")} placeholder="0812xxxxxxxx" />
            </div>
            <div>
              <label className="form-label">Identity Number</label>
              <input type="number" className="input" value={form.identityNumber} onChange={update("identityNumber")} placeholder="16 digit NIK" />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label className="form-label">Domisili Address</label>
            <textarea className="form-textarea" value={form.address} onChange={update("address")} placeholder="Full residential address" />
          </div>
          {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
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