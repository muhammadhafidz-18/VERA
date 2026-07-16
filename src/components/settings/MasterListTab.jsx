// src/components/settings/MasterListTab.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import ConfirmModal from "@/components/shared/ConfirmModal";
import MasterItemModal from "./MasterItemModal";

export default function MasterListTab({ items, setItems, labelCol, employeeField, employees, kind }) {
  const [modalMode, setModalMode] = useState(null); // null | "add" | { edit: name }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const countFor = (name) => employees.filter((e) => e[employeeField] === name).length;

  const apiBase = `/api/settings/${kind}`;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleAddSave = async (value) => {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error);
      return;
    }
    setItems((list) => [...list, value]);
    setModalMode(null);
    showToast(`${labelCol} "${value}" was successfully added.`);
  };

  const handleEditSave = async (oldName, value) => {
    const res = await fetch(apiBase, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error);
      return;
    }
    setItems((list) => list.map((i) => (i === oldName ? value : i)));
    setModalMode(null);
    showToast(`${labelCol} was successfully updated.`);
  };

  const handleDeleteConfirm = async (name) => {
    await fetch(apiBase, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setItems((list) => list.filter((i) => i !== name));
    setConfirmDelete(null);
    showToast(`${labelCol} "${name}" was successfully deleted.`);
  };

  const filteredItems = items.filter((name) => name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="filters">
        <div className="input-wrap" style={{ width: 220 }}>
          <span className="input-icon">
            <Icon name="search" size={14} />
          </span>
          <input className="input has-icon" placeholder={`Search ${labelCol.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModalMode("add")}>
          <Icon name="plus" size={12} /> Add {labelCol}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{labelCol}</th>
              <th>Total Employee</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
                  No Data Available
                </td>
              </tr>
            )}
            {filteredItems.map((name) => {
              const inUse = countFor(name) > 0;
              return (
                <tr key={name}>
                  <td style={{ fontWeight: 500 }}>{name}</td>
                  <td className="mono">{countFor(name)}</td>
                  <td>
                    <button className="btn-icon" title="Edit" onClick={() => setModalMode({ edit: name })}>
                      <Icon name="pencil" size={13} />
                    </button>
                    <button
                      className="btn-icon"
                      style={{ color: inUse ? undefined : "var(--red)" }}
                      title={inUse ? `Cannot be deleted — still used by ${countFor(name)} employees` : "Delete"}
                      disabled={inUse}
                      onClick={() => setConfirmDelete(name)}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalMode === "add" && <MasterItemModal title={`Add ${labelCol}`} labelCol={labelCol} items={items} onClose={() => setModalMode(null)} onSave={handleAddSave} />}
      {modalMode && modalMode.edit && (
        <MasterItemModal
          title={`Edit ${labelCol}`}
          labelCol={labelCol}
          items={items}
          initialValue={modalMode.edit}
          excludeSelf={modalMode.edit}
          onClose={() => setModalMode(null)}
          onSave={(value) => handleEditSave(modalMode.edit, value)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${labelCol}`}
          message={`Are you sure you want to delete this ${labelCol.toLowerCase()} "${confirmDelete}"? This action cannot be undone.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDeleteConfirm(confirmDelete)}
        />
      )}
      {toast && (
        <div className="toast">
          <b>&#10003;</b> {toast}
        </div>
      )}
    </div>
  );
}
