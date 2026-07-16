// src/components/layout/DashboardLayout.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { loadSession, clearSession } from "@/lib/session";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session || session.stage !== "dashboard") {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!checked) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar onLogout={handleLogout} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
