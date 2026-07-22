// src/lib/vera/chatHelpers.js

export const VERA_CHAT_HISTORY_KEY = "vera_chat_history_v2";

export function getVeraGreeting(userName) {
  const firstName = (userName || "").trim().split(/\s+/)[0] || "there";
  return `Hi ${firstName}! How can I help you today?`;
}

export function loadVeraChatHistory() {
  try {
    const raw = sessionStorage.getItem(VERA_CHAT_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch (err) {
    return null;
  }
}

export function sanitizeVeraReply(text) {
  if (!text) return text;
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// Display-level safety net (defense in depth on top of the server-side checks).
export const VERA_RAW_DATA_PATTERN =
  /[\[{]\s*["{]|"[a-zA-Z_]+"\s*:\s*["\[{0-9]|\b(get_employees|create_employee)\s*\(|```|^\s*(javascript|json|python)\s*$/im;
export const VERA_META_PATTERN =
  /(don'?t have access|doesn'?t have access|no access to (a |the |any )?(live |real )?tool|aren'?t connected|isn'?t connected|not connected (right now|to)|my (own )?(tool|api)\b|in this (session|conversation)[, ]|i should be (honest|transparent)|to be (honest|transparent) with you|my previous (responses|answers)|(responses|answers) (were|are) inconsistent|flagging (this|it) to|contact (your |the )?(hr )?admin|hubungi (pihak )?admin)/i;

// Deterministic client-side shortcut for logout/reset confirmation — bypasses
// the AI entirely once the user confirms, so it can never be dodged.
export const VERA_LOGOUT_CONFIRM_QUESTION_PATTERN = /(yakin.*(logout|keluar dari sistem)|logout.*sekarang\?|sign out\??|log out\??.*(now|sekarang)?)/i;
export const VERA_RESET_CONFIRM_QUESTION_PATTERN = /(yakin.*(reset|menghapus riwayat|hapus (riwayat|percakapan))|reset (the )?conversation|clear (the )?(chat|conversation) history)/i;
export const VERA_AFFIRMATIVE_PATTERN = /^(ya|iya|yes|yep|yup|betul|benar|setuju|lanjutkan|oke|ok|correct|confirm(ed)?)[!.,\s]*$/i;

export const COMMAND_SUGGESTIONS = [
  { icon: "microphone", kind: "Ask VERA", text: "Schedule a sync with the dev team for tomorrow." },
  { icon: "calendar", kind: "Command", text: "Create a meeting invite for my 1-on-1." },
  { icon: "ticket", kind: "Command", text: "Create a task for a broken laptop to IT." },
  { icon: "address-book", kind: "Ask VERA", text: "Who is in the Finance division?" },
];
