// src/app/employees/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import Pagination from "@/components/employees/Pagination";
import AgeCard from "@/components/employees/AgeCard";
import EmployeeFormModal from "@/components/employees/EmployeeFormModal";
import ResignFormModal from "@/components/employees/ResignFormModal";
import EmployeeFilterMenu from "@/components/employees/EmployeeFilterMenu";
import ColumnSettingsMenu, { DEFAULT_VISIBLE_COLUMNS } from "@/components/employees/ColumnSettingsMenu";
import { AGE_BRACKETS, getAge, PAGE_SIZE } from "@/lib/vera/employeeHelpers";
import EmployeesPageSkeleton from "@/components/shared/skeletons/EmployeesPageSkeleton";

const COLUMN_STORAGE_KEY = "vera_employee_columns";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // "active" | "inactive" | "all"
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [resignTargetEmployee, setResignTargetEmployee] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);

  // --- Import/Export ---
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Load saved column preference once on mount (client-only — localStorage
  // isn't available during SSR).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) setVisibleColumns({ ...DEFAULT_VISIBLE_COLUMNS, ...JSON.parse(saved) });
    } catch {
      // ignore malformed/unavailable storage — falls back to defaults
    }
  }, []);

  const handleColumnsChange = (next) => {
    setVisibleColumns(next);
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (e.g. private browsing) — preference just
      // won't persist across reloads, not worth surfacing to the user
    }
  };

  useEffect(() => {
    async function load() {
      const [empRes, divRes, brRes] = await Promise.all([
        fetch("/api/employees?status=all").then((r) => r.json()),
        fetch("/api/settings/divisions").then((r) => r.json()),
        fetch("/api/settings/branches").then((r) => r.json()),
      ]);
      setEmployees(empRes.employees || []);
      setDivisions(divRes.divisions || []);
      setBranches(brRes.branches || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchDivision = !divisionFilter || e.division === divisionFilter;
    const matchBranch = !branchFilter || e.branch === branchFilter;
    const bracket = AGE_BRACKETS.find((b) => b.key === ageFilter);
    const matchAge = !ageFilter || (bracket && bracket.test(getAge(e.birthDate)));
    const matchStatus = statusFilter === "all" || (e.status || "active") === statusFilter;
    return matchSearch && matchDivision && matchBranch && matchAge && matchStatus;
  });

  const activeEmployees = employees.filter((e) => (e.status || "active") === "active");

  const pageSize = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const applyDivisionFilter = (val) => {
    setDivisionFilter(val);
    setPage(1);
  };
  const applyBranchFilter = (val) => {
    setBranchFilter(val);
    setPage(1);
  };
  const applyStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
  };
  const resetAllFilters = () => {
    setSearch("");
    setDivisionFilter("");
    setBranchFilter("");
    setAgeFilter("");
    setStatusFilter("active");
    setPage(1);
  };

  const handleSave = async (form, isEdit) => {
    if (isEdit) {
      const res = await fetch(`/api/employees/${encodeURIComponent(form.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setEmployees((list) => list.map((e) => (e.id === form.id ? data.employee : e)));
    } else {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setEmployees((list) => [data.employee, ...list]);
    }
    setModalOpen(false);
    setEditingEmployee(null);
  };

  const handleResignConfirm = async (employee, resignDate) => {
    const res = await fetch(`/api/employees/${encodeURIComponent(employee.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resign", resignDate }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmployees((list) => list.map((e) => (e.id === employee.id ? data.employee : e)));
      showToast(
        data.employee.status === "inactive"
          ? `${employee.name} has been marked as resigned.`
          : `${employee.name}'s resignation has been scheduled for ${resignDate}.`
      );
    } else {
      showToast(data.error || "Failed to resign employee.");
    }
    setResignTargetEmployee(null);
  };

  const handleReactivate = async (employee) => {
    const res = await fetch(`/api/employees/${encodeURIComponent(employee.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reactivate" }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmployees((list) => list.map((e) => (e.id === employee.id ? data.employee : e)));
      showToast(`${employee.name} has been reactivated.`);
    } else {
      showToast(data.error || "Failed to reactivate employee.");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/employees/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Import failed.");
        return;
      }
      setImportResult(data);
      const refreshed = await fetch("/api/employees?status=all").then((r) => r.json());
      setEmployees(refreshed.employees || []);
    } catch (err) {
      showToast("Network error while importing.");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <EmployeesPageSkeleton />
      </DashboardLayout>
    );
  }

  const hasAnyFilter = search || divisionFilter || branchFilter || ageFilter || statusFilter !== "active";
  const colCount = 3 + Object.values(visibleColumns).filter(Boolean).length; // ID + Name + Action are fixed

  return (
    <DashboardLayout>
      <div>
        <div className="stat-grid" style={{ gridTemplateColumns: "220px 320px", marginBottom: 20 }}>
          <div className="stat-card blue">
            <div className="stat-label">Total Employees</div>
            <div className="stat-value">{activeEmployees.length}</div>
            <div className="stat-sub">Currently active</div>
          </div>
          <AgeCard
            employees={activeEmployees}
            ageFilter={ageFilter}
            onSelectBracket={(key) => {
              setAgeFilter((prev) => (prev === key ? "" : key));
              setPage(1);
            }}
          />
        </div>

        <div className="section-header">
          <div className="section-title">Employee Directory</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Icon name="upload" size={14} /> {importing ? "Importing…" : "Import"}
            </button>
            <a className="btn btn-secondary" href="/api/employees/export">
              <Icon name="download" size={14} /> Export
            </a>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingEmployee(null);
                setModalOpen(true);
              }}
            >
              <Icon name="plus" size={14} /> Add Employee
            </button>
          </div>
        </div>

        <div className="filters">
            <div className="input-wrap" style={{ width: 240 }}>
              <span className="input-icon">
                <Icon name="search" size={14} />
              </span>
              <input className="input has-icon" placeholder="Search name, ID, or email..." value={search} onChange={handleSearchChange} />
            </div>

            <EmployeeFilterMenu
              divisions={divisions}
              branches={branches}
              divisionFilter={divisionFilter}
              branchFilter={branchFilter}
              statusFilter={statusFilter}
              onDivisionChange={applyDivisionFilter}
              onBranchChange={applyBranchFilter}
              onStatusChange={applyStatusFilter}
              onReset={() => {
                applyDivisionFilter("");
                applyBranchFilter("");
                applyStatusFilter("active");
              }}
            />

            <ColumnSettingsMenu visibleColumns={visibleColumns} onChange={handleColumnsChange} />

            {hasAnyFilter && (
              <button className="btn btn-secondary btn-sm" onClick={resetAllFilters}>
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="card-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                {visibleColumns.email && <th>Email</th>}
                {visibleColumns.branch && <th>Branch</th>}
                {visibleColumns.division && <th>Division</th>}
                {visibleColumns.joinDate && <th>Join Date</th>}
                {visibleColumns.phone && <th>Phone Number</th>}
                {visibleColumns.status && <th>Status</th>}
                {visibleColumns.resignDate && <th>Resign Date</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={colCount} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#9900;</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No Data Available</div>
                  </td>
                </tr>
              )}
              {paged.map((e) => (
                <tr key={e.id}>
                  <td className="mono" data-label="Employee ID">{e.id}</td>
                  <td style={{ fontWeight: 500 }} data-label="Name">{e.name}</td>
                  {visibleColumns.email && <td className="mono" data-label="Email">{e.email}</td>}
                  {visibleColumns.branch && <td data-label="Branch">{e.branch}</td>}
                  {visibleColumns.division && <td data-label="Division">{e.division}</td>}
                  {visibleColumns.joinDate && <td className="mono" data-label="Join Date">{e.joinDate}</td>}
                  {visibleColumns.phone && <td className="mono" data-label="Phone">{e.phone}</td>}
                  {visibleColumns.status && (
                    <td data-label="Status">
                      {e.status === "inactive" ? (
                        <span className="badge gray">Resigned</span>
                      ) : (
                        <span className="badge green">Active</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.resignDate && <td className="mono" data-label="Resign Date">{e.resignDate || "-"}</td>}
                  <td className="card-actions">
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => {
                        setEditingEmployee(e);
                        setModalOpen(true);
                      }}
                    >
                      <Icon name="pencil" size={13} />
                    </button>
                    {e.status === "inactive" ? (
                      <button className="btn-icon" title="Reactivate" onClick={() => handleReactivate(e)}>
                        <Icon name="refresh" size={13} />
                      </button>
                    ) : e.resignDate ? (
                      <button className="btn-icon" title="Cancel scheduled resign" onClick={() => handleReactivate(e)}>
                        <Icon name="x" size={13} />
                      </button>
                    ) : (
                      <button
                        className="btn-icon"
                        style={{ color: "var(--red)" }}
                        title="Resign"
                        onClick={() => setResignTargetEmployee(e)}
                      >
                        <Icon name="logout" size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={currentPage} totalPages={totalPages} setPage={setPage} total={filtered.length} pageSize={pageSize} />
        </div>

        {modalOpen && (
          <EmployeeFormModal
            initialData={editingEmployee}
            divisions={divisions}
            branches={branches}
            employees={employees}
            onClose={() => {
              setModalOpen(false);
              setEditingEmployee(null);
            }}
            onSave={handleSave}
          />
        )}

        {resignTargetEmployee && (
          <ResignFormModal
            employee={resignTargetEmployee}
            onClose={() => setResignTargetEmployee(null)}
            onConfirm={(resignDate) => handleResignConfirm(resignTargetEmployee, resignDate)}
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
                        {importResult.total} data karyawan berhasil diproses ({importResult.created} baru, {importResult.updated} diperbarui).
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
                          {importResult.created + importResult.updated} berhasil ({importResult.created} baru, {importResult.updated} diperbarui), {importResult.failed} gagal dari {importResult.total} baris.
                        </div>
                      </div>
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
                      {(importResult.results ?? []).filter((r) => !r.success)
                        .map((r, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "8px 12px",
                              borderTop: i === 0 ? "none" : "1px solid var(--border)",
                              fontSize: 12.5,
                            }}
                          >
                            <b>{r.row}</b> {r.email && `(${r.email})`} — <span style={{ color: "var(--red)" }}>{r.error}</span>
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
    </DashboardLayout>
  );
}