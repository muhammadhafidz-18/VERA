// src/components/meetings/MeetingCalendar.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";
import { meetingColor, MONTHS_ID, DAY_NAMES_ID, isoDate, startOfCalGrid } from "@/lib/vera/meetingHelpers";

const VIEW_OPTIONS = [
  { value: "day", label: "Hari", shortcut: "D" },
  { value: "week", label: "Minggu", shortcut: "W" },
  { value: "month", label: "Bulan", shortcut: "M" },
];

// Hour range shown in Day/Week grid views. Office meetings realistically
// fall in this window — kept fixed (no scroll) to stay simple and reliable.
const GRID_START_HOUR = 0;
const GRID_END_HOUR = 24;
const HOUR_HEIGHT = 48; // px per hour row

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function startOfWeek(d) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function MeetingCalendar({ meetings, onDayClick, onEventClick }) {
  const today = new Date();
  const [view, setView] = useState("month");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const todayIso = isoDate(today);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setViewMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const eventsByDate = {};
  meetings.forEach((m) => {
    (eventsByDate[m.date] = eventsByDate[m.date] || []).push(m);
  });

  function goToday() {
    setAnchor(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  function shift(n) {
    const d = new Date(anchor);
    if (view === "month") d.setMonth(d.getMonth() + n);
    else if (view === "week") d.setDate(d.getDate() + n * 7);
    else d.setDate(d.getDate() + n);
    setAnchor(d);
  }

  // ---------- Header label, changes per view ----------
  let label;
  if (view === "month") {
    label = `${MONTHS_ID[anchor.getMonth()]} ${anchor.getFullYear()}`;
  } else if (view === "week") {
    const ws = startOfWeek(anchor);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    label =
      ws.getMonth() === we.getMonth()
        ? `${ws.getDate()}–${we.getDate()} ${MONTHS_ID[ws.getMonth()]} ${ws.getFullYear()}`
        : `${ws.getDate()} ${MONTHS_ID[ws.getMonth()]} – ${we.getDate()} ${MONTHS_ID[we.getMonth()]} ${we.getFullYear()}`;
  } else {
    label = `${anchor.getDate()} ${MONTHS_ID[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }

  const currentViewOption = VIEW_OPTIONS.find((v) => v.value === view);

  return (
    <div className="cal-wrap">
      <div className="cal-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="cal-nav-btn" onClick={() => shift(-1)}>
            &lsaquo;
          </button>
          <button className="cal-today-btn" onClick={goToday}>
            Today
          </button>
          <button className="cal-nav-btn" onClick={() => shift(1)}>
            &rsaquo;
          </button>
          <span className="cal-label">{label}</span>
        </div>

        <div className="cal-view-switcher" ref={menuRef}>
          <button className="cal-view-btn" onClick={() => setViewMenuOpen((o) => !o)}>
            {currentViewOption.label}{" "}
            <Icon name="chevron-right" size={13} style={{ transform: viewMenuOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .15s" }} />
          </button>
          {viewMenuOpen && (
            <div className="cal-view-menu">
              {VIEW_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className={`cal-view-menu-item${opt.value === view ? " active" : ""}`}
                  onClick={() => {
                    setView(opt.value);
                    setViewMenuOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  <span className="cal-view-menu-shortcut">{opt.shortcut}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === "month" && (
        <MonthView anchor={anchor} eventsByDate={eventsByDate} todayIso={todayIso} onDayClick={onDayClick} />
      )}
      {view === "week" && (
        <GridView
          days={Array.from({ length: 7 }, (_, i) => {
            const d = startOfWeek(anchor);
            d.setDate(d.getDate() + i);
            return d;
          })}
          eventsByDate={eventsByDate}
          todayIso={todayIso}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      )}
      {view === "day" && (
        <GridView days={[anchor]} eventsByDate={eventsByDate} todayIso={todayIso} onDayClick={onDayClick} onEventClick={onEventClick} />
      )}
    </div>
  );
}

// ---------- Month view (unchanged behavior from before) ----------
function MonthView({ anchor, eventsByDate, todayIso, onDayClick }) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfCalGrid(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <>
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
          const evs = (eventsByDate[iso] || []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
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
                      style={{ background: `color-mix(in srgb, ${col} 15%, var(--bg2))`, borderLeft: `3px solid ${col}` }}
                      title={`${m.title} — ${m.startTime}–${m.endTime} — ${m.location || "-"}`}
                    >
                      {m.title}
                    </div>
                  );
                })}
                {evs.length > 3 && <div className="cal-more">+{evs.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------- Day/Week view — shared hour-grid renderer ----------
function GridView({ days, eventsByDate, todayIso, onDayClick, onEventClick }) {
  const hours = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
  const totalHeight = hours.length * HOUR_HEIGHT;
  const bodyRef = useRef(null);

  // Auto-scroll to a sensible starting point (6 AM) instead of forcing the
  // user to scroll up from midnight every time the view opens.
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = Math.max(0, (6 - GRID_START_HOUR) * HOUR_HEIGHT - 20);
    }
  }, [days]);

  return (
    <div className="cal-gridview">
      <div className="cal-gridview-head" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div className="cal-gridview-head-corner" />
        {days.map((d) => {
          const iso = isoDate(d);
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={`cal-gridview-head-cell${isToday ? " today" : ""}`}
              onClick={() => onDayClick(iso)}
            >
              <div className="cal-gridview-head-dayname">{DAY_NAMES_ID[(d.getDay() + 6) % 7]}</div>
              <div className={`cal-gridview-head-daynum${isToday ? " today" : ""}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      <div ref={bodyRef} className="cal-gridview-body" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, height: totalHeight, maxHeight: 480, overflowY: "auto" }}>
        <div className="cal-gridview-hourcol">
          {hours.map((h) => (
            <div key={h} className="cal-gridview-hourlabel" style={{ height: HOUR_HEIGHT }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((d) => {
          const iso = isoDate(d);
          const evs = eventsByDate[iso] || [];
          return (
            <div key={iso} className="cal-gridview-daycol" style={{ height: totalHeight }}>
              {hours.map((h) => (
                <div key={h} className="cal-gridview-hourline" style={{ height: HOUR_HEIGHT }} />
              ))}
              {evs.map((m) => {
                const startMin = timeToMinutes(m.startTime) - GRID_START_HOUR * 60;
                const endMin = timeToMinutes(m.endTime) - GRID_START_HOUR * 60;
                const top = Math.max(0, (startMin / 60) * HOUR_HEIGHT);
                const height = Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT);
                const col = meetingColor(m.title);
                return (
                  <div
                    key={m.id}
                    className="cal-gridview-event"
                    style={{ top, height, background: `color-mix(in srgb, ${col} 22%, var(--bg2))`, borderLeft: `3px solid ${col}` }}
                    title={`${m.title} — ${m.startTime}–${m.endTime} — ${m.location || "-"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(m);
                    }}
                  >
                    <div className="cal-gridview-event-title">{m.title}</div>
                    <div className="cal-gridview-event-time">
                      {m.startTime}–{m.endTime}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}