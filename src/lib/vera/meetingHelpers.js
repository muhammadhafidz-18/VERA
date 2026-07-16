// src/lib/vera/meetingHelpers.js
export const MEETING_COLORS = ["var(--blue)", "var(--green)", "var(--purple)", "var(--teal)", "var(--yellow)"];

export function meetingColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return MEETING_COLORS[Math.abs(hash) % MEETING_COLORS.length];
}

export const MONTHS_ID = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DAY_NAMES_ID = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfCalGrid(monthStart) {
  const d = new Date(monthStart);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
