// src/components/layout/DashboardLayout.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { loadSession, clearSession } from "@/lib/session";
import { signOut } from "@/lib/supabase/auth";
import VeraFloatingChat from "@/components/vera/VeraFloatingChat";

export default function DashboardLayout({ children, hideFloatingChat = false }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = loadSession();
    if (!session || session.stage !== "dashboard") {
      router.replace("/login");
      return;
    }
    setUser(session.user || null);
    setChecked(true);
  }, [router]);

  async function handleLogout() {
    clearSession();
    await signOut();
    router.replace("/login");
  }

  if (!checked) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar onLogout={handleLogout} user={user} />
        <div className="content">{children}</div>
      </div>
      {!hideFloatingChat && <VeraFloatingChat onLogout={handleLogout} />}
    </div>
  );
}