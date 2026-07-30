// src/lib/session.js
import { VERA_CHAT_HISTORY_KEY } from "@/lib/vera/chatHelpers";

const SESSION_KEY = "vera_session_v1";

// After this much inactivity, the session is treated as stale and the
// person is sent back to /login — even if sessionStorage itself never
// technically got cleared (mobile browsers often "freeze" a background
// tab instead of closing it, which lets old sessionStorage survive far
// longer than intended).
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.stage !== "intro" && parsed.stage !== "dashboard")) return null;

    if (parsed.savedAt && Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS) {
      clearSession();
      return null;
    }
    return parsed;
  } catch (err) {
    return null;
  }
}

export function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
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