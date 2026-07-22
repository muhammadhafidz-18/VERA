// src/components/layout/Sidebar.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/lib/Icon";
import { PAGE_PATHS } from "@/lib/constants";

const CARD_ITEMS = [
  { key: "employees", label: "Employee Directory", icon: "address-book", sub: "Data List" },
  { key: "meetings", label: "Meeting Schedule", icon: "calendar", sub: "Meet Your Team" },
  { key: "tickets", label: "Tasks", icon: "ticket", sub: "Check Your Tasks" },
  { key: "settings", label: "Settings", icon: "settings", sub: "Configuration" },
  { key: "help", label: "Help & Support", icon: "help", sub: "FAQ" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [toggleTop, setToggleTop] = useState(null);
  const meetingRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      if (meetingRef.current && sidebarRef.current) {
        const meetingRect = meetingRef.current.getBoundingClientRect();
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        setToggleTop(meetingRect.top - sidebarRect.top + meetingRect.height / 2);
      }
    };
    measure();
    const t = setTimeout(measure, 150);
    return () => clearTimeout(t);
  }, [collapsed]);

  return (
    <div className={`sidebar${collapsed ? " collapsed" : ""}`} ref={sidebarRef}>
      <button
        className="sidebar-toggle-btn"
        style={toggleTop ? { top: toggleTop, transform: "translateY(-50%)" } : undefined}
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Expand menu" : "Collapse menu"}
      >
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={13} />
      </button>

      <div className="sidebar-logo">
        <div className="logo-mark-wrap">
          <img src="/logo-vera.png" alt="VERA" className="logo-mark" />
        </div>
        {!collapsed && (
          <>
            <div className="logo-text">V.E.R.A</div>
            <div className="logo-sub">Virtual Employee Resource Assistant</div>
          </>
        )}
      </div>

      <div className="nav-section">
        <Link href={PAGE_PATHS.command} className={`nav-ask-pill${pathname === PAGE_PATHS.command ? " active" : ""}`} title={collapsed ? "Ask VERA" : ""}>
          <div className="sidebar-mic-icon">
            <Icon name="microphone" size={14} />
          </div>
          {!collapsed && (
            <>
              <div className="sidebar-mic-text">
                <b>Ask V.E.R.A</b>
                <span>Your Assistant</span>
              </div>
              <span className="star">
                <Icon name="star" size={12} />
              </span>
            </>
          )}
        </Link>

        {CARD_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={PAGE_PATHS[item.key]}
            ref={item.key === "meetings" ? meetingRef : null}
            className={`nav-card${pathname === PAGE_PATHS[item.key] ? " active" : ""}`}
            title={collapsed ? item.label : ""}
          >
            <div className="nav-card-icon">
              <Icon name={item.icon} size={16} />
            </div>
            {!collapsed && (
              <div className="nav-card-body">
                <div className="nav-card-title">{item.label}</div>
                <div className="nav-card-sub">{item.sub}</div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
