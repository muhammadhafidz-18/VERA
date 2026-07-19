// src/lib/Icon.jsx
// Full icon set, ported 1:1 from the HTML prototype (all icons used across every page).
export default
function Icon({ name, size = 16, style }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "plus":
      return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case "pencil":
      return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
    case "trash":
      return <svg {...common}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>;
    case "x":
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case "lock":
      return <svg {...common}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
    case "microphone":
      return <svg {...common}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
    case "player-stop":
      return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="1" /></svg>;
    case "message-chatbot":
      return <svg {...common}><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M9 21l3-4 3 4" /><circle cx="8.5" cy="11" r="0.5" fill="currentColor" /><circle cx="15.5" cy="11" r="0.5" fill="currentColor" /></svg>;
    case "address-book":
      return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="10" r="2.5" /><path d="M8 17c0-2 2-3 4-3s4 1 4 3" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "ticket":
      return <svg {...common}><path d="M3 9a2 2 0 002 2v2a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2v-2a2 2 0 010-4V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" /><line x1="13" y1="7" x2="13" y2="17" strokeDasharray="2 2" /></svg>;
    case "heart-handshake":
      return <svg {...common}><path d="M12 20s-6.5-4-8.5-7.5C1.7 9.8 3.5 6.5 6.5 6.5c1.7 0 3 .8 3.7 2 .7-1.2 2-2 3.7-2 3 0 4.8 3.3 3 6-2 3.5-4.9 7.5-4.9 7.5z" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
    case "users":
      return <svg {...common}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
    case "shield-lock":
      return <svg {...common}><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><rect x="9" y="11" width="6" height="5" rx="1" /><path d="M10.5 11V9a1.5 1.5 0 013 0v2" /></svg>;
    case "key":
      return <svg {...common}><circle cx="7" cy="14" r="4" /><path d="M9.5 11.5L20 1" /><path d="M16 5l3 3" /><path d="M13 8l3 3" /></svg>;
    case "help":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 1.5-2.5 3.5" /><line x1="12" y1="17.5" x2="12" y2="17.5" /></svg>;
    case "activity":
      return <svg {...common}><polyline points="3 12 8 12 10 18 14 6 16 12 21 12" /></svg>;
    case "star":
      return <svg {...common} fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" stroke="none" /></svg>;
    case "logout":
      return <svg {...common}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    case "arrow-left":
      return <svg {...common}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    case "chevron-left":
      return <svg {...common}><polyline points="15 18 9 12 15 6" /></svg>;
    case "chevron-right":
      return <svg {...common}><polyline points="9 18 15 12 9 6" /></svg>;
    case "check":
      return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>;
    case "sparkles":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2l1.6 4.8L18 8l-4.4 1.2L12 14l-1.6-4.8L6 8l4.4-1.2L12 2zM5 14l.9 2.7L8.5 17l-2.6.8L5 20.5l-.9-2.7L1.5 17l2.6-.3L5 14zM19 13l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4L15.8 16l2.4-.8.8-2.2z" /></svg>;
    case "refresh":
      return <svg {...common}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>;
    case "alert-triangle":
      return <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
    case "paperclip":
      return <svg {...common}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>;
    case "file-text":
      return <svg {...common}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
    case "history":
      return <svg {...common}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 106 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>;
    case "send":
      return <svg {...common}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    case "eye":
      return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "eye-off":
      return <svg {...common}><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.3 20.3 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.29 20.29 0 01-3.22 4.5" /><path d="M14.12 14.12a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
    case "sun":
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
    case "moon":
      return <svg {...common}><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>;
    default:
      return null;
    case "video":
      return <svg {...common}><rect x="1" y="5" width="15" height="14" rx="2" /><polygon points="23 7 16 12 23 17 23 7" /></svg>;
    case "map-pin":
      return <svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "external-link":
      return <svg {...common}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
  }
}
