// src/lib/chatbase.js
// Config now stored server-side in Supabase (integration_settings table),
// shared across every user, instead of per-browser localStorage.
// callChatbase() itself has no browser-only dependencies, so it's used both
// client-side (for the Settings "Test" button) and server-side (by
// executeTool.js, for the search_product_knowledge Ask V.E.R.A tool).
export async function getChatbaseConfig() {
  try {
    const res = await fetch("/api/settings/integrations/chatbase");
    if (!res.ok) throw new Error("Failed to load config");
    const data = await res.json();
    return data.config;
  } catch (err) {
    return { enabled: false, apiKey: "", chatbotId: "" };
  }
}

export async function saveChatbaseConfig(config) {
  try {
    const res = await fetch("/api/settings/integrations/chatbase", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || "Failed to save." };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to save." };
  }
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
