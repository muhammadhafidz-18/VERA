// src/lib/vera/employeeHelpers.js
export const AGE_BRACKETS = [
  { key: "<20", label: "< 20", hex: "#3B7BC4", test: (a) => a < 20 },
  { key: "20-35", label: "20 - 35", hex: "#3F9D4E", test: (a) => a >= 20 && a <= 35 },
  { key: "36-50", label: "36 - 50", hex: "#C98A18", test: (a) => a >= 36 && a <= 50 },
  { key: ">50", label: "> 50", hex: "#7B6FC4", test: (a) => a > 50 },
];

export function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

export function getAge(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export const PAGE_SIZE = 10;
