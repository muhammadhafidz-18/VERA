// src/lib/session.js
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
  } catch (err) {}
}
