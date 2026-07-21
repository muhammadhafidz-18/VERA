// src/components/settings/VoiceAiTab.jsx
"use client";
import { useState, useEffect } from "react";
import Icon from "@/lib/Icon";
import { getVeraVoiceConfig, saveVeraVoiceConfig, speakWithElevenLabs } from "@/lib/voice";

export default function VoiceAiTab() {
  const [config, setConfig] = useState({ enabled: false, apiKey: "", voiceId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState("");

  useEffect(() => {
    getVeraVoiceConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  const update = (field) => (e) => setConfig((c) => ({ ...c, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const result = await saveVeraVoiceConfig(config);
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error || "Gagal menyimpan.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestError("");
    try {
      if (!config.apiKey || !config.voiceId) throw new Error("Isi API Key dan Voice ID dulu.");
      await speakWithElevenLabs("Hi, saya V.E.R.A. Ini contoh suara custom yang baru kamu atur.", config.apiKey, config.voiceId);
    } catch (err) {
      setTestError("Gagal memutar suara. Cek kembali API Key dan Voice ID kamu.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="card-note" style={{ marginBottom: 18 }}>
        <b>Catatan:</b> API Key ini sekarang disimpan di server (Supabase), berlaku untuk semua user — bukan lagi
        per-browser. RLS masih permisif untuk semua akun yang login (belum dibatasi khusus Superadmin) — perketat ini
        sebelum production.
      </div>

      {loading && <p style={{ fontSize: 13, color: "var(--text3)" }}>Loading...</p>}

      <div className="form-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg3)", padding: "12px 14px", borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Use Custom Voice AI (ElevenLabs)</div>
          <div style={{ fontSize: 11.5, color: "var(--text3)" }}>Kalau nonaktif, sistem otomatis pakai voice bawaan browser.</div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))} />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">ElevenLabs API Key</label>
        <input className="input" type="password" value={config.apiKey} onChange={update("apiKey")} placeholder="sk_..." />
      </div>

      <div className="form-row">
        <label className="form-label">Voice ID</label>
        <input className="input" value={config.voiceId} onChange={update("voiceId")} placeholder="e.g. 21m00Tcm4TlvDq8ikWAM" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Ambil Voice ID dari dashboard ElevenLabs kamu (menu Voices → pilih voice → copy ID).</p>
      </div>

      {saveError && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {saveError}
        </div>
      )}
      {testError && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {testError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-secondary" onClick={handleTest} disabled={testing}>
          {testing ? <Icon name="refresh" size={13} className="spin" /> : <Icon name="microphone" size={13} />}
          {testing ? "Memutar..." : "Test Voice"}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Save"}
        </button>
      </div>
    </div>
  );
}
