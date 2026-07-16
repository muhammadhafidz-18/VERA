// src/components/employees/AgeCard.jsx
"use client";
import { useState } from "react";
import { AGE_BRACKETS, shadeColor, getAge } from "@/lib/vera/employeeHelpers";

export default function AgeCard({ employees, ageFilter, onSelectBracket }) {
  const [hovered, setHovered] = useState(null);
  const ages = employees.map((e) => getAge(e.birthDate)).filter((a) => a !== null);
  const total = ages.length || 0;
  const counts = AGE_BRACKETS.map((b) => ({ ...b, count: ages.filter(b.test).length }));

  const r = 40;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  const segments = counts.map((b) => {
    const frac = total ? b.count / total : 0;
    const segLen = frac * circumference;
    const seg = { ...b, offset: cumulative, segLen };
    cumulative += segLen;
    return seg;
  });

  const focused = hovered || ageFilter;
  const focusedBracket = counts.find((b) => b.key === focused);
  const centerCount = focusedBracket ? focusedBracket.count : total;
  const centerLabel = focusedBracket ? focusedBracket.label : "Total";

  return (
    <div className="stat-card purple age-card">
      <div className="age-pie-wrap">
        <svg viewBox="0 0 100 100" style={{ overflow: "visible" }}>
          <defs>
            {AGE_BRACKETS.map((b) => (
              <linearGradient key={b.key} id={`donutGrad-${b.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={shadeColor(b.hex, 55)} />
                <stop offset="45%" stopColor={b.hex} />
                <stop offset="100%" stopColor={shadeColor(b.hex, -35)} />
              </linearGradient>
            ))}
            <filter id="donutShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#0b2a4a" floodOpacity="0.4" />
            </filter>
          </defs>

          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg3)" strokeWidth="12" />

          {segments.map((s) => {
            const isFocused = focused === s.key;
            const isDimmed = focused && !isFocused;
            if (isDimmed) return null;
            return (
              <circle
                key={"glow-" + s.key}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.hex}
                strokeWidth={isFocused ? 22 : 16}
                strokeDasharray={`${s.segLen} ${circumference - s.segLen}`}
                strokeDashoffset={-s.offset}
                style={{ opacity: isFocused ? 0.45 : 0.22, filter: "blur(3px)", pointerEvents: "none" }}
              />
            );
          })}

          <g filter="url(#donutShadow)">
            {segments.map((s) => {
              const isFocused = focused === s.key;
              const isDimmed = focused && !isFocused;
              return (
                <circle
                  key={s.key}
                  className="age-pie-seg"
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={`url(#donutGrad-${s.key})`}
                  strokeWidth={isFocused ? 15 : 12}
                  strokeLinecap="round"
                  strokeDasharray={`${s.segLen - 1.5} ${circumference - s.segLen + 1.5}`}
                  strokeDashoffset={-s.offset}
                  style={{ opacity: isDimmed ? 0.3 : 1, transition: "stroke-width .15s, opacity .15s" }}
                  onMouseEnter={() => setHovered(s.key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelectBracket(s.key)}
                />
              );
            })}
          </g>
        </svg>
        <div className="age-pie-center">
          <span className="n">{centerCount}</span>
          <span className="l">{centerLabel}</span>
        </div>
      </div>
      <div className="age-legend">
        <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".8px", fontWeight: 500, marginBottom: 2 }}>
          Age Distribution
        </div>
        {counts.map((b) => (
          <div
            key={b.key}
            className={`age-legend-row${ageFilter === b.key ? " active" : ""}`}
            onMouseEnter={() => setHovered(b.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectBracket(b.key)}
          >
            <span className="age-legend-dot" style={{ background: `linear-gradient(135deg, ${shadeColor(b.hex, 45)}, ${b.hex})`, boxShadow: `0 0 6px ${b.hex}99` }} />
            {b.label}
            <span className="age-legend-count">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
