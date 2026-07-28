// src/components/settings/MasterListTab.jsx
"use client";
import { useState, useRef } from "react";
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

  // --- Import/Export ---
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

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

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiBase}/import`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Import failed.");
        return;
      }
      setImportResult(data);
      const refreshed = await fetch(apiBase).then((r) => r.json());
      setItems(refreshed[kind] || []);
    } catch (err) {
      showToast("Network error while importing.");
    } finally {
      setImporting(false);
    }
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
        <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleImportFile} />
        <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          <Icon name="upload" size={12} /> {importing ? "Importing…" : "Import"}
        </button>
        <a className="btn btn-secondary btn-sm" href={`${apiBase}/export`}>
          <Icon name="download" size={12} /> Export
        </a>
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

      {importResult && (
        <div className="modal-overlay" onClick={() => setImportResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Import Result</h3>
              <button className="btn-icon" onClick={() => setImportResult(null)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="modal-body">
              {importResult.failed === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(34,197,94,0.12)",
                      color: "var(--green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="check" size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Import berhasil</div>
                    <div style={{ fontSize: 12.5, color: "var(--text2)" }}>
                      {importResult.created} baru ditambahkan, {importResult.updated} diubah namanya.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0 16px" }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(234,179,8,0.12)",
                        color: "#eab308",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="alert-triangle" size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Import selesai dengan beberapa catatan</div>
                      <div style={{ fontSize: 12.5, color: "var(--text2)" }}>
                        {importResult.created} baru, {importResult.updated} diubah, {importResult.failed} gagal dari {importResult.total} baris.
                      </div>
                    </div>
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
                    {importResult.results
                      .filter((r) => !r.success)
                      .map((r, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 12px",
                            borderTop: i === 0 ? "none" : "1px solid var(--border)",
                            fontSize: 12.5,
                          }}
                        >
                          <b>{r.row}</b> {r.name && `(${r.name})`} — <span style={{ color: "var(--red)" }}>{r.error}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <b>&#10003;</b> {toast}
        </div>
      )}
    </div>
  );
}