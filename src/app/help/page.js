// src/app/help/page.js
"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";

const MODULES = [
  { icon: "message-chatbot", title: "Ask V.E.R.A", desc: "The main conversation hub. Type or record your voice — Claude detects your intent and automatically calls the right module (create a meeting, create a task, look up employee data, etc)." },
  { icon: "address-book", title: "Employee Directory", desc: "Search, add, edit, and delete employee data. Filterable by division and age group, complete with an age distribution pie chart." },
  { icon: "calendar", title: "Meeting Schedule", desc: "View schedules in a monthly calendar layout. Add new meetings via the Add Meeting button or by clicking directly on a date." },
  { icon: "ticket", title: "Tasks", desc: "Submit tasks, complaints, or requests to other divisions. Descriptions are automatically refined by AI before being sent to the target division." },
  { icon: "settings", title: "Settings", desc: "Manage User Management, Role Management, Divisions, and Branches — Superadmin only." },
];

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760 }}>
        <div className="card-note" style={{ marginBottom: 18 }}>
          General flow: go to <b>Ask V.E.R.A</b>, then chat or talk directly — the system will pick the right module and execute it for you automatically.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MODULES.map((m, i) => (
            <div key={i} className="card-note" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--red-s)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={m.icon} size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>
                  {i + 1}. {m.title}
                </div>
                <div>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
