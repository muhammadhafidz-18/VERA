// src/lib/vera/taskUiHelpers.js
export const TASK_STATUS_STYLES = {
  open: { label: "Open", badge: "gray" },
  in_progress: { label: "In Progress", badge: "blue" },
  done: { label: "Done", badge: "green" },
  cancelled: { label: "Cancelled", badge: "red" },
};

export const TASK_PRIORITY_STYLES = {
  low: { label: "Low", badge: "gray" },
  medium: { label: "Medium", badge: "blue" },
  high: { label: "High", badge: "red" },
};

export function taskUserById(employees, id) {
  return employees.find((e) => e.id === id) || { id, name: "Unknown", division: "-" };
}

export function taskTimeAgo(ts) {
  if (!ts) return "-";
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.round(diffH / 24)}d ago`;
}

export function formatTaskDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
