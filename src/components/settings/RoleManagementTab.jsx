// src/components/settings/RoleManagementTab.jsx
"use client";
import { useState, useEffect } from "react";

export default function RoleManagementTab() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => setEmployees(data.employees || []));
  }, []);

  const roles = [
    { name: "Superadmin", desc: "Full access to all menus including Settings, Employee Directory, and other sensitive data.", count: employees.filter((e) => e.role === "Superadmin").length },
    { name: "User", desc: "Access to 3 main menus: Ask VERA, Meeting Schedule, and Tasks.", count: employees.filter((e) => e.role === "User").length },
  ];

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Description</th>
            <th>Total User</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.name}>
              <td>
                <span className={`badge ${r.name === "Superadmin" ? "purple" : "gray"}`}>{r.name}</span>
              </td>
              <td style={{ color: "var(--text2)" }}>{r.desc}</td>
              <td className="mono">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
