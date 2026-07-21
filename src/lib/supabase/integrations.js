// src/lib/supabase/integrations.js
//
// Server-side config for third-party integrations (Chatbase, ElevenLabs),
// backed by the `integration_settings` table — shared across every user,
// instead of the old per-browser localStorage approach.
import { createClient } from "./server";

function mapRow(provider, row) {
  const config = row?.config || {};
  const base = { enabled: !!row?.enabled, apiKey: row?.api_key || "" };
  if (provider === "elevenlabs") return { ...base, voiceId: config.voice_id || "" };
  if (provider === "chatbase") return { ...base, chatbotId: config.chatbot_id || "" };
  return base;
}

function emptyConfig(provider) {
  const base = { enabled: false, apiKey: "" };
  if (provider === "elevenlabs") return { ...base, voiceId: "" };
  if (provider === "chatbase") return { ...base, chatbotId: "" };
  return base;
}

export async function getIntegrationConfig(provider) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_settings")
    .select("enabled, api_key, config")
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    console.error(`getIntegrationConfig(${provider}):`, error.message);
    return emptyConfig(provider);
  }
  if (!data) return emptyConfig(provider);
  return mapRow(provider, data);
}

export async function saveIntegrationConfig(provider, input) {
  const supabase = await createClient();

  const config = provider === "elevenlabs" ? { voice_id: input.voiceId || "" } : { chatbot_id: input.chatbotId || "" };

  const { error } = await supabase
    .from("integration_settings")
    .upsert(
      { provider, enabled: !!input.enabled, api_key: input.apiKey || "", config, updated_at: new Date().toISOString() },
      { onConflict: "provider" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}
