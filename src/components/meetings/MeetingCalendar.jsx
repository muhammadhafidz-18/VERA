// src/components/meetings/MeetingCalendar.jsx
"use client";
import { useState } from "react";
import { meetingColor, MONTHS_ID, DAY_NAMES_ID, isoDate, startOfCalGrid } from "@/lib/vera/meetingHelpers";

export default function MeetingCalendar({ meetings, onDayClick, onEventClick }) {
  const today = new Date();
  const [anchor, setAnchor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const todayIso = isoDate(today);

  const eventsByDate = {};
  meetings.forEach((m) => {
    (eventsByDate[m.date] = eventsByDate[m.date] || []).push(m);
  });

  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfCalGrid(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const label = `${MONTHS_ID[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const shiftMonth = (n) => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + n, 1));

  const uniqueTitles = [...new Set(meetings.map((m) => m.title))];

  return (
    <div className="cal-wrap">
      <div className="cal-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="cal-nav-btn" onClick={() => shiftMonth(-1)}>
            &lsaquo;
          </button>
          <button className="cal-today-btn" onClick={() => setAnchor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </button>
          <button className="cal-nav-btn" onClick={() => shiftMonth(1)}>
            &rsaquo;
          </button>
          <span className="cal-label">{label}</span>
        </div>
      </div>
      <div className="cal-head">
        {DAY_NAMES_ID.map((n) => (
          <div key={n} className="cal-head-cell">
            {n}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const iso = isoDate(d);
          const isToday = iso === todayIso;
          const evs = (eventsByDate[iso] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={i} className={`cal-cell${inMonth ? "" : " out"}${isToday ? " today" : ""}`} onClick={() => onDayClick(iso)}>
              <span className={`cal-daynum${isToday ? " today" : ""}`}>{d.getDate()}</span>
              <div className="cal-events">
                {evs.slice(0, 3).map((m) => {
                  const col = meetingColor(m.title);
                  return (
                    <div
                      key={m.id}
                      className="cal-event"
                      style={{ background: col + "1a", borderLeft: `3px solid ${col}` }}
                      title={`${m.title} — ${m.time} — ${m.location || "-"}${m.createdByName ? ` — by ${m.createdByName}` : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(m);
                      }}
                    >
                      <b style={{ color: col }}>{m.time}</b> {m.title}
                    </div>
                  );
                })}
                {evs.length > 3 && <div className="cal-event-more">+{evs.length - 3} lainnya</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Meetings</span>
        {uniqueTitles.map((t) => (
          <span key={t} className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: meetingColor(t) }} /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}
