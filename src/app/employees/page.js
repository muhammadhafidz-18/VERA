// src/app/employees/page.js
"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";
import Pagination from "@/components/employees/Pagination";
import AgeCard from "@/components/employees/AgeCard";
import EmployeeFormModal from "@/components/employees/EmployeeFormModal";
import { AGE_BRACKETS, getAge, PAGE_SIZE } from "@/lib/vera/employeeHelpers";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    async function load() {
      const [empRes, divRes, brRes] = await Promise.all([
        fetch("/api/employees").then((r) => r.json()),
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
    const bracket = AGE_BRACKETS.find((b) => b.key === ageFilter);
    const matchAge = !ageFilter || (bracket && bracket.test(getAge(e.birthDate)));
    return matchSearch && matchDivision && matchAge;
  });

  const pageSize = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handleDivisionChange = (e) => {
    setDivisionFilter(e.target.value);
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

  const handleDelete = async (id) => {
    if (!confirm(`Delete employee data ${id}?`)) return;
    const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setEmployees((list) => list.filter((e) => e.id !== id));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="stat-grid" style={{ gridTemplateColumns: "220px 320px", marginBottom: 20 }}>
          <div className="stat-card blue">
            <div className="stat-label">Total Employees</div>
            <div className="stat-value">{employees.length}</div>
            <div className="stat-sub">Currently active</div>
          </div>
          <AgeCard
            employees={employees}
            ageFilter={ageFilter}
            onSelectBracket={(key) => {
              setAgeFilter((prev) => (prev === key ? "" : key));
              setPage(1);
            }}
          />
        </div>

        <div className="section-header">
          <div className="section-title">Employee Directory</div>
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

        <div className="filters">
          <div className="input-wrap" style={{ width: 240 }}>
            <span className="input-icon">
              <Icon name="search" size={14} />
            </span>
            <input className="input has-icon" placeholder="Search name, ID, or email..." value={search} onChange={handleSearchChange} />
          </div>
          <select className="input" style={{ width: 180 }} value={divisionFilter} onChange={handleDivisionChange}>
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {(search || divisionFilter || ageFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch("");
                setDivisionFilter("");
                setAgeFilter("");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Join Date</th>
                <th>Phone Number</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#9900;</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No Data Available</div>
                  </td>
                </tr>
              )}
              {paged.map((e) => (
                <tr key={e.id}>
                  <td className="mono">{e.id}</td>
                  <td style={{ fontWeight: 500 }}>{e.name}</td>
                  <td className="mono">{e.email}</td>
                  <td>{e.branch}</td>
                  <td className="mono">{e.joinDate}</td>
                  <td className="mono">{e.phone}</td>
                  <td>
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
                    <button className="btn-icon" style={{ color: "var(--red)" }} title="Delete" onClick={() => handleDelete(e.id)}>
                      <Icon name="trash" size={13} />
                    </button>
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
            onClose={() => {
              setModalOpen(false);
              setEditingEmployee(null);
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
