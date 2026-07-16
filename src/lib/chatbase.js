// src/lib/chatbase.js — ported from the HTML prototype.
// SECURITY NOTE: same caveat as ElevenLabs — API key lives in localStorage
// and this calls Chatbase directly from the browser. Fine for solo testing,
// not safe for real multi-user production (move to a server route first).
const VERA_CHATBASE_CONFIG_KEY = "vera_chatbase_config_v1";

export function getChatbaseConfig() {
  try {
    const raw = localStorage.getItem(VERA_CHATBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, apiKey: "", chatbotId: "" };
  } catch (err) {
    return { enabled: false, apiKey: "", chatbotId: "" };
  }
}

export function saveChatbaseConfig(config) {
  try {
    localStorage.setItem(VERA_CHATBASE_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {}
}

export async function callChatbase(question, apiKey, chatbotId) {
  const response = await fetch("https://www.chatbase.co/api/v1/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ content: question, role: "user" }],
      chatbotId,
      stream: false,
      temperature: 0,
    }),
  });
  if (!response.ok) throw new Error(`Chatbase request failed (${response.status})`);
  const data = await response.json();
  return data.text || "";
}
