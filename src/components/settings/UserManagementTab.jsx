// src/components/settings/UserManagementTab.jsx
"use client";
import { useState, useEffect } from "react";
import Icon from "@/lib/Icon";
import Pagination from "@/components/employees/Pagination";
import EditRoleModal from "./EditRoleModal";
import { PAGE_SIZE } from "@/lib/vera/employeeHelpers";
import { requestPasswordReset } from "@/lib/supabase/auth";

// Response body isn't always JSON (a crashed route can return an empty body
// or an HTML error page) — res.json() throws in that case. Parse
// defensively so the UI can always show *some* error message instead of
// crashing with "Unexpected end of JSON input".
async function safeJson(res) {
  try {
    return await res.json();
  } catch (err) {
    return { error: `Server returned an unexpected response (status ${res.status}).` };
  }
}

export default function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await safeJson(res);
      setUsers(
        (data.employees || []).map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          role: e.role,
          authUserId: e.authUserId,
        }))
      );
    } catch (err) {
      showToast("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = async (id) => {
    if (!confirm(`Deactivate access for ${id}?`)) return;
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((list) => list.filter((u) => u.id !== id));
      } else {
        const data = await safeJson(res);
        showToast(data.error || "Failed to deactivate employee.");
      }
    } catch (err) {
      showToast("Network error while deactivating employee.");
    }
  };

  const handleSaveRole = async (id, newRole) => {
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
        setEditing(null);
      } else {
        const data = await safeJson(res);
        showToast(data.error || "Failed to update role.");
      }
    } catch (err) {
      showToast("Network error while updating role.");
    }
  };

  const handleInvite = async (user) => {
    setBusyId(user.id);
    try {
      const res = await fetch("/api/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast(data.error || "Failed to send invite.");
        return;
      }
      showToast(`Invite sent to ${user.email}.`);
      load();
    } catch (err) {
      showToast("Network error while sending invite.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResend = async (user) => {
    setBusyId(user.id);
    try {
      const { error } = await requestPasswordReset(user.email);
      showToast(error ? error : `Login setup link resent to ${user.email}.`);
    } catch (err) {
      showToast("Network error while resending invite.");
    } finally {
      setBusyId(null);
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
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
                  <span className={`badge ${u.authUserId ? "green" : "yellow"}`}>
                    {u.authUserId ? "Invited" : "Not Invited"}
                  </span>
                </td>
                <td style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {!u.authUserId ? (
                    <button className="btn btn-secondary btn-sm" disabled={busyId === u.id} onClick={() => handleInvite(u)}>
                      {busyId === u.id ? <Icon name="refresh" size={12} className="spin" /> : <Icon name="send" size={12} />}
                      Invite
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" disabled={busyId === u.id} onClick={() => handleResend(u)}>
                      {busyId === u.id ? <Icon name="refresh" size={12} className="spin" /> : <Icon name="refresh" size={12} />}
                      Resend
                    </button>
                  )}
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
      {toast && (
        <div className="toast">
          <b>&#10003;</b> {toast}
        </div>
      )}
    </div>
  );
}