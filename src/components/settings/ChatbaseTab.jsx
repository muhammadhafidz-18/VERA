// src/components/settings/ChatbaseTab.jsx
"use client";
import { useState, useEffect } from "react";
import Icon from "@/lib/Icon";
import { getChatbaseConfig, saveChatbaseConfig, callChatbase } from "@/lib/chatbase";

export default function ChatbaseTab() {
  const [config, setConfig] = useState({ enabled: false, apiKey: "", chatbotId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState("");
  const [testAnswer, setTestAnswer] = useState("");

  useEffect(() => {
    getChatbaseConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  const update = (field) => (e) => setConfig((c) => ({ ...c, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const result = await saveChatbaseConfig(config);
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
    setTestAnswer("");
    try {
      if (!config.apiKey || !config.chatbotId) throw new Error("Isi API Key dan Chatbot ID dulu.");
      const answer = await callChatbase("Apa saja fitur utama produk ini?", config.apiKey, config.chatbotId);
      setTestAnswer(answer || "(Chatbase tidak mengembalikan jawaban.)");
    } catch (err) {
      setTestError("Gagal menghubungi Chatbase. Cek kembali API Key dan Chatbot ID kamu.");
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
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Use Product Knowledge Base (Chatbase)</div>
          <div style={{ fontSize: 11.5, color: "var(--text3)" }}>Kalau nonaktif, Ask V.E.R.A cuma jawab dari pengetahuan umum, tidak bisa akses knowledge base produk kamu.</div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))} />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">Chatbase API Key</label>
        <input className="input" type="password" value={config.apiKey} onChange={update("apiKey")} placeholder="Bearer token dari Chatbase" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Ambil dari Chatbase Dashboard → Workspace Settings → API Keys.</p>
      </div>

      <div className="form-row">
        <label className="form-label">Chatbot ID</label>
        <input className="input" value={config.chatbotId} onChange={update("chatbotId")} placeholder="e.g. abc123XYZ" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Ambil dari halaman chatbot kamu di Chatbase → Settings → Chatbot ID.</p>
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
      {testAnswer && (
        <div className="card-note" style={{ marginBottom: 16, background: "var(--purple-s)", borderColor: "var(--purple)" }}>
          <b>Contoh jawaban:</b> {testAnswer}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-secondary" onClick={handleTest} disabled={testing}>
          {testing ? <Icon name="refresh" size={13} className="spin" /> : <Icon name="sparkles" size={13} />}
          {testing ? "Menguji..." : "Test Connection"}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Save"}
        </button>
      </div>
    </div>
  );
}
