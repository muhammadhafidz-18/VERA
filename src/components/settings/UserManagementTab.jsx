// src/components/settings/UserManagementTab.jsx
"use client";
import { useState, useEffect } from "react";
import Icon from "@/lib/Icon";
import Pagination from "@/components/employees/Pagination";
import EditRoleModal from "./EditRoleModal";
import { PAGE_SIZE } from "@/lib/vera/employeeHelpers";

export default function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => {
        setUsers((data.employees || []).map((e) => ({ id: e.id, name: e.name, email: e.email, role: e.role })));
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = async (id) => {
    if (!confirm(`Deactivate access for ${id}?`)) return;
    const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setUsers((list) => list.filter((u) => u.id !== id));
  };

  const handleSaveRole = async (id, newRole) => {
    const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      setEditing(null);
    }
  };

  if (loading) return <div style={{ padding: 24, color: "var(--text3)" }}>Loading...</div>;

  return (
    <div>
      <div className="filters">
        <div className="input-wrap" style={{ width: 260 }}>
          <span className="input-icon">
            <Icon name="search" size={14} />
          </span>
          <input
            className="input has-icon"
            placeholder="Search name, ID, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
                  No Data Available
                </td>
              </tr>
            )}
            {paged.map((u) => (
              <tr key={u.id}>
                <td className="mono">{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td className="mono">{u.email}</td>
                <td>
                  <span className={`badge ${u.role === "Superadmin" ? "purple" : "gray"}`}>{u.role}</span>
                </td>
                <td>
                  <button className="btn-icon" title="Edit Role" onClick={() => setEditing(u)}>
                    <Icon name="pencil" size={13} />
                  </button>
                  <button className="btn-icon" style={{ color: "var(--red)" }} title="Deactivate" onClick={() => handleDelete(u.id)}>
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={currentPage} totalPages={totalPages} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>
      {editing && <EditRoleModal employee={editing} onClose={() => setEditing(null)} onSave={handleSaveRole} />}
    </div>
  );
}
