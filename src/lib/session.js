// src/lib/session.js
import { VERA_CHAT_HISTORY_KEY } from "@/lib/vera/chatHelpers";

const SESSION_KEY = "vera_session_v1";

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.stage === "intro" || parsed.stage === "dashboard")) return parsed;
    return null;
  } catch (err) {
    return null;
  }
}

export function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (err) {}
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    // Also wipe VERA's chat history + one-time-greeting flag — otherwise
    // logging in as a different user in the same browser tab still shows
    // the previous user's leftover chat (including the old greeting).
    sessionStorage.removeItem(VERA_CHAT_HISTORY_KEY);
    sessionStorage.removeItem("vera_greeted_v1");
  } catch (err) {}
}