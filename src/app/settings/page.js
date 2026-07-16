// src/app/settings/page.js
"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UserManagementTab from "@/components/settings/UserManagementTab";
import RoleManagementTab from "@/components/settings/RoleManagementTab";
import MasterListTab from "@/components/settings/MasterListTab";
import VoiceAiTab from "@/components/settings/VoiceAiTab";
import ChatbaseTab from "@/components/settings/ChatbaseTab";

const TABS = [
  ["users", "User Management"],
  ["roles", "Role Management"],
  ["divisi", "Division"],
  ["branch", "Branch"],
  ["voice", "Voice AI"],
  ["knowledge", "Product Knowledge"],
];

export default function SettingsPage() {
  const [tab, setTab] = useState("users");
  const [divisions, setDivisions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dRes, bRes, eRes] = await Promise.all([
        fetch("/api/settings/divisions").then((r) => r.json()),
        fetch("/api/settings/branches").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);
      setDivisions(dRes.divisions || []);
      setBranches(bRes.branches || []);
      setEmployees(eRes.employees || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="subtab-row">
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <button key={key} className={`subtab-btn${active ? " active" : ""}`} onClick={() => setTab(key)}>
                {label}
                {active && <span className="subtab-underline" />}
              </button>
            );
          })}
        </div>
        {loading ? (
          <div style={{ padding: 24, color: "var(--text3)" }}>Loading...</div>
        ) : (
          <>
            {tab === "users" && <UserManagementTab />}
            {tab === "roles" && <RoleManagementTab />}
            {tab === "divisi" && (
              <MasterListTab items={divisions} setItems={setDivisions} labelCol="Division" employeeField="division" employees={employees} kind="divisions" />
            )}
            {tab === "branch" && (
              <MasterListTab items={branches} setItems={setBranches} labelCol="Branch" employeeField="branch" employees={employees} kind="branches" />
            )}
            {tab === "voice" && <VoiceAiTab />}
            {tab === "knowledge" && <ChatbaseTab />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
