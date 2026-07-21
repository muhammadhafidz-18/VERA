// src/components/vera/VeraFloatingChat.jsx
"use client";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/lib/Icon";
import VeraChat from "./VeraChat";
import { PAGE_PATHS } from "@/lib/constants";

export default function VeraFloatingChat({ onLogout, position = "right" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const chatRef = useRef(null);

  if (pathname === PAGE_PATHS.command) return null;

  const posClass = position === "left" ? " left" : "";

  return (
    <>
      {open && (
        <div className={`vera-float-panel${posClass}`}>
          <div className="vera-float-panel-head">
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="message-chatbot" size={14} /> Ask V.E.R.A
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="vera-replay-btn"
                onClick={() => chatRef.current?.resetChat()}
                title="Hapus riwayat chat dan mulai dari awal"
              >
                <Icon name="refresh" size={12} /> Reset
              </button>
              <span className="vera-live-badge">
                <span className="vera-live-dot" /> AI Active
              </span>
            </span>
          </div>
          <div className="vera-float-panel-body">
            <VeraChat ref={chatRef} compact hideHeader onLogout={onLogout} />
          </div>
        </div>
      )}

      <button
        className={`vera-float-btn${posClass}`}
        onClick={() => setOpen((v) => !v)}
        title={open ? "Tutup Ask V.E.R.A" : "Ask V.E.R.A"}
      >
        <Icon name={open ? "x" : "message-chatbot"} size={20} />
      </button>
    </>
  );
}