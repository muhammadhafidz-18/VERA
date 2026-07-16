// src/lib/voice.js
// Ported as-is from the HTML prototype. ElevenLabs integration is not
// wired up yet in this migration — that's a later step (needs a server
// API route so the key isn't exposed to the browser). For now this is
// browser-only Web Speech API TTS, exactly matching the current fallback
// behavior of the prototype.

const VERA_FEMALE_VOICE_HINTS =
  /female|wanita|perempuan|zira|samantha|victoria|susan|karen|moira|tessa|fiona|joanna|salli|kimberly|ivy|amy|emma|damayanti|siti|ida|google (uk english female|us english)/i;
const VERA_MALE_VOICE_HINTS = /male|pria|david|mark|daniel|alex|fred|george|james|google (uk english male)/i;
const VERA_ID_WORD_HINTS =
  /\b(yang|adalah|saya|akan|dengan|untuk|tidak|belum|sudah|kamu|kita|ada|dan|atau|bisa|silakan|mohon|terima kasih|selamat|apa|bagaimana|berapa|kenapa|jika|kalau|ini|itu|dari|karena|juga|masih|lagi|dulu|nanti|sekarang|baik|boleh)\b/i;

export function detectSpeechLang(text) {
  return VERA_ID_WORD_HINTS.test(text || "") ? "id-ID" : "en-US";
}

export function pickVeraVoice(lang) {
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const prefix = (lang || "id-ID").slice(0, 2).toLowerCase();
    const langVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
    const pool = langVoices.length ? langVoices : voices;
    const femaleInPool = pool.find((v) => VERA_FEMALE_VOICE_HINTS.test(v.name) || !VERA_MALE_VOICE_HINTS.test(v.name));
    if (femaleInPool) return femaleInPool;
    const anyFemale = voices.find((v) => VERA_FEMALE_VOICE_HINTS.test(v.name));
    if (anyFemale) return anyFemale;
    return langVoices[0] || null;
  } catch (err) {
    return null;
  }
}

export function warmUpVoices() {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => window.speechSynthesis.getVoices(), { once: true });
  } catch (err) {}
}

function speakWithBrowser(text, langOverride) {
  try {
    window.speechSynthesis.cancel();
    const lang = langOverride || detectSpeechLang(text);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 1.02;
    utter.pitch = 1.06;
    const voice = pickVeraVoice(lang);
    if (voice) utter.voice = voice;
    return new Promise((resolve) => {
      utter.onend = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    });
  } catch (err) {
    return Promise.resolve();
  }
}

// TODO: once ElevenLabs is wired through a server API route, try that first
// here (same pattern as the prototype's speak()), falling back to browser TTS.
export async function speak(text, onEnd, langOverride) {
  const config = getVeraVoiceConfig();
  if (config.enabled && config.apiKey && config.voiceId) {
    try {
      await speakWithElevenLabs(text, config.apiKey, config.voiceId);
      if (onEnd) onEnd();
      return;
    } catch (err) {
      // Fall through to browser TTS if the ElevenLabs call fails (bad key, quota, offline, etc).
    }
  }
  await speakWithBrowser(text, langOverride);
  if (onEnd) onEnd();
}

// ---------------------------------------------------------------------
// ElevenLabs (Voice AI) config — ported from the HTML prototype.
// SECURITY NOTE: this stores the API key in localStorage and calls
// ElevenLabs directly from the browser, same as the prototype did. This is
// fine for solo testing but NOT safe for a real multi-user deployment — the
// key should move to a server API route before going to production.
// ---------------------------------------------------------------------
const VERA_VOICE_CONFIG_KEY = "vera_voice_config_v1";

export function getVeraVoiceConfig() {
  try {
    const raw = localStorage.getItem(VERA_VOICE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, apiKey: "", voiceId: "" };
  } catch (err) {
    return { enabled: false, apiKey: "", voiceId: "" };
  }
}

export function saveVeraVoiceConfig(config) {
  try {
    localStorage.setItem(VERA_VOICE_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {}
}

export function speakWithElevenLabs(text, apiKey, voiceId) {
  return new Promise((resolve, reject) => {
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`ElevenLabs request failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch(reject);
      })
      .catch(reject);
  });
}
