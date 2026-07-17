// src/components/vera/VeraFloatingChat.jsx
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/lib/Icon";
import VeraChat from "./VeraChat";
import { PAGE_PATHS } from "@/lib/constants";

export default function VeraFloatingChat({ onLogout }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === PAGE_PATHS.command) return null;

  return (
    <>
      {open && (
        <div className="vera-float-panel">
          <div className="vera-float-panel-head">
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="message-chatbot" size={14} /> Ask V.E.R.A
            </span>
          </div>
          <div className="vera-float-panel-body">
            <VeraChat compact onLogout={onLogout} />
          </div>
        </div>
      )}

      <button
        className="vera-float-btn"
        onClick={() => setOpen((v) => !v)}
        title={open ? "Tutup Ask V.E.R.A" : "Ask V.E.R.A"}
      >
        <Icon name={open ? "x" : "message-chatbot"} size={20} />
      </button>
    </>
  );
}