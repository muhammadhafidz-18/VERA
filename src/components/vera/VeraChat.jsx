// src/components/vera/VeraChat.jsx
"use client";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import Icon from "@/lib/Icon";
import { speak, warmUpVoices } from "@/lib/voice";
import { clearSession, loadSession } from "@/lib/session";
import { signOut } from "@/lib/supabase/auth";
import {
  VERA_CHAT_HISTORY_KEY,
  getVeraGreeting,
  loadVeraChatHistory,
  sanitizeVeraReply,
  VERA_RAW_DATA_PATTERN,
  VERA_META_PATTERN,
  VERA_LOGOUT_CONFIRM_QUESTION_PATTERN,
  VERA_RESET_CONFIRM_QUESTION_PATTERN,
  VERA_AFFIRMATIVE_PATTERN,
  COMMAND_SUGGESTIONS,
} from "@/lib/vera/chatHelpers";

const MAX_ATTACHMENT_MB = 5;
const SPREADSHEET_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const VeraChat = forwardRef(function VeraChat({ onLogout, compact = false, hideHeader = false }, ref) {
  const greeting = getVeraGreeting(loadSession()?.user?.name);
  const [messages, setMessages] = useState(() => loadVeraChatHistory() || [{ role: "assistant", text: greeting }]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // { name, mediaType, kind, data }
  const [attachError, setAttachError] = useState("");
  const fileInputRef = useRef(null);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptPartsRef = useRef([]);

  useEffect(() => {
    warmUpVoices();
    try {
      const alreadyGreeted = sessionStorage.getItem("vera_greeted_v1") === "true";
      if (!alreadyGreeted) {
        sessionStorage.setItem("vera_greeted_v1", "true");
        speak(messages[0].text);
      }
    } catch (err) {
      speak(messages[0].text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(VERA_CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (err) {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const handleResetChat = () => {
    const fresh = [{ role: "assistant", text: greeting }];
    setMessages(fresh);
    try {
      sessionStorage.setItem(VERA_CHAT_HISTORY_KEY, JSON.stringify(fresh));
    } catch (err) {}
    speak(greeting);
  };

  useImperativeHandle(ref, () => ({
    resetChat: handleResetChat,
  }));

  const resetChatSilently = () => {
    const fresh = [{ role: "assistant", text: greeting }];
    setMessages(fresh);
    try {
      sessionStorage.setItem(VERA_CHAT_HISTORY_KEY, JSON.stringify(fresh));
    } catch (err) {}
  };

  const doLogout = async () => {
    clearSession();
    await signOut();
    if (onLogout) onLogout();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setAttachError("");

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    const isSpreadsheet = SPREADSHEET_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isPdf && !isImage && !isSpreadsheet) {
      setAttachError("Cuma bisa attach PDF, gambar (PNG/JPG), atau Excel/CSV (.xlsx, .xls, .csv).");
      return;
    }
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setAttachError(`File maksimal ${MAX_ATTACHMENT_MB}MB.`);
      return;
    }

    const kind = isPdf ? "document" : isImage ? "image" : "spreadsheet";

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1] || "";
      setAttachedFile({ name: file.name, mediaType: file.type, kind, data: base64 });
    };
    reader.onerror = () => setAttachError("Gagal membaca file. Coba lagi.");
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachError("");
  };

  const sendText = async (text, viaVoice) => {
    const hasAttachment = !!attachedFile;
    const effectiveText = text?.trim() || (hasAttachment ? "Tolong ringkas isi dokumen ini." : "");
    if (!effectiveText || thinking) return;

    // Deterministic shortcut: if V.E.R.A just asked to confirm logout/reset
    // and this message is a bare "yes", act on it directly — no AI round-trip.
    const lastMsg = messages[messages.length - 1];
    const isAffirmative = VERA_AFFIRMATIVE_PATTERN.test(effectiveText);
    if (lastMsg && lastMsg.role === "assistant" && isAffirmative && !hasAttachment) {
      if (VERA_LOGOUT_CONFIRM_QUESTION_PATTERN.test(lastMsg.text)) {
        const confirmMsg = "Baik, kamu akan logout sekarang.";
        setMessages((m) => [...m, { role: "user", text: effectiveText }, { role: "assistant", text: confirmMsg }]);
        setInput("");
        if (viaVoice) speak(confirmMsg);
        setTimeout(doLogout, 1600);
        return;
      }
      if (VERA_RESET_CONFIRM_QUESTION_PATTERN.test(lastMsg.text)) {
        resetChatSilently();
        if (viaVoice) speak(greeting);
        setInput("");
        return;
      }
    }

    const userMsg = { role: "user", text: effectiveText, fileName: hasAttachment ? attachedFile.name : null };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);
    const attachmentToSend = attachedFile;
    setAttachedFile(null);

    const history = nextMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      // Keep history lightweight — only the current turn sends the actual
      // file bytes (see `attachment` below); past turns just note a file
      // was attached, so we're not re-sending the same bytes every turn.
      content: m.fileName ? `[Melampirkan file: ${m.fileName}] ${m.text}` : m.text,
    }));

    try {
      const res = await fetch("/api/vera/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          attachment: attachmentToSend
            ? { mediaType: attachmentToSend.mediaType, kind: attachmentToSend.kind, data: attachmentToSend.data }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      let reply = sanitizeVeraReply(data.text);
      let opType = data.dbOperationType;
      if (VERA_RAW_DATA_PATTERN.test(reply) || VERA_META_PATTERN.test(reply)) {
        reply = "Maaf, saya sedang kesulitan mengambil data itu. Coba tanyakan lagi sebentar lagi, ya.";
        opType = null;
      }
      setMessages((m) => [...m, { role: "assistant", text: reply, opType, downloadUrl: data.downloadUrl || null }]);
      if (viaVoice) speak(reply);

      if (data.resetRequested) resetChatSilently();
      if (data.logoutRequested) setTimeout(doLogout, 1600);
    } catch (err) {
      const fallback = err?.message
        ? `Maaf, terjadi kendala: ${err.message}`
        : "Maaf, terjadi kendala koneksi ke V.E.R.A. Coba lagi sebentar.";
      setMessages((m) => [...m, { role: "assistant", text: fallback }]);
      if (viaVoice) speak(fallback);
    } finally {
      setThinking(false);
    }
  };

  const send = () => sendText(input, false);

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionAPI = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognitionAPI) {
      setMessages((m) => [...m, { role: "assistant", text: "Browser ini belum mendukung input suara. Silakan ketik pertanyaan kamu, ya." }]);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      transcriptPartsRef.current = [];
      setRecording(true);
    };
    recognition.onend = () => {
      setRecording(false);
      const fullTranscript = transcriptPartsRef.current.join(" ").trim();
      if (fullTranscript) sendText(fullTranscript, true);
    };
    recognition.onerror = (e) => {
      setRecording(false);
      let msg = "Gagal merekam suara. Coba lagi, atau ketik pertanyaan kamu.";
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        msg = "Akses microphone diblokir oleh browser. Klik ikon gembok di address bar dan izinkan microphone.";
      } else if (e.error === "no-speech") {
        msg = "Tidak ada suara terdeteksi. Coba tekan mic dan langsung bicara.";
      }
      setMessages((m) => [...m, { role: "assistant", text: msg }]);
    };
    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcriptPartsRef.current.push(e.results[i][0].transcript);
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setRecording(false);
      setMessages((m) => [...m, { role: "assistant", text: "Tidak bisa mengakses microphone di browser ini." }]);
    }
  };

  const isEmpty = messages.length <= 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: compact ? "100%" : "calc(100vh - 105px)",
        maxWidth: compact ? "none" : 720,
        width: "100%",
        margin: compact ? 0 : "0 auto",
        minHeight: 0,
      }}
    >
      {!hideHeader && (
        <div className="vera-hero">
          <div className="vera-hero-icon-badge">
            <Icon name="message-chatbot" size={17} style={{ color: "#fff" }} />
          </div>
          <div className="vera-hero-text">
            <div className="vera-hero-title">Ask V.E.R.A</div>
            <div className="vera-hero-sub">Type or talk directly — one door for all your operational needs.</div>
          </div>
          <button className="vera-replay-btn" onClick={handleResetChat} title="Hapus riwayat chat dan mulai dari awal">
            <Icon name="refresh" size={12} /> Reset
          </button>
          <span className="vera-live-badge">
            <span className="vera-live-dot" /> AI Active
          </span>
        </div>
      )}

      {isEmpty && (
        <div className="suggestion-panel">
          <div className="suggestion-grid">
            {COMMAND_SUGGESTIONS.map((s, i) => (
              <div key={i} className="suggestion-card" onClick={() => sendText(s.text, false)}>
                <div className="suggestion-icon">
                  <Icon name={s.icon} size={18} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div className="suggestion-label">
                    <b>{s.kind}:</b>
                  </div>
                  <div className="suggestion-text">&ldquo;{s.text}&rdquo;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="vera-chat-card">
        <div ref={scrollRef} className="chat-scroll">
          {messages.map((m, i) => (
            <div key={i} className={`bubble-row ${m.role}`}>
              {m.role === "assistant" && <div className="avatar-vera">V</div>}
              <div className={`bubble ${m.role}`}>
                {m.fileName && (
                  <div className="chat-file-chip">
                    <Icon name="paperclip" size={12} /> {m.fileName}
                  </div>
                )}
                <div>{m.text}</div>
                {m.opType && <span className={`op-badge ${m.opType.toLowerCase()}`}>{m.opType}</span>}
                {m.downloadUrl && (
                  <a href={m.downloadUrl} download className="chat-download-btn">
                    <Icon name="file-text" size={14} /> Download Excel
                  </a>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="bubble-row assistant">
              <div className="avatar-vera">V</div>
              <div className="bubble assistant" style={{ opacity: 0.7 }}>
                V.E.R.A is thinking...
              </div>
            </div>
          )}
        </div>
        {attachedFile && (
          <div className="chat-attach-preview">
            <Icon name={attachedFile.kind === "image" ? "sparkles" : "file-text"} size={13} />
            <span>{attachedFile.name}</span>
            <button type="button" onClick={removeAttachment} title="Hapus lampiran">
              <Icon name="x" size={13} />
            </button>
          </div>
        )}
        {attachError && <div className="form-error" style={{ margin: "0 4px 8px" }}>{attachError}</div>}
        <div className="chat-input-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*,.xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <div className="chat-input-wrap">
            <button
              type="button"
              className="chat-attach-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Lampirkan PDF, gambar, atau Excel/CSV"
            >
              <Icon name="paperclip" size={16} />
            </button>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={attachedFile ? "Tanya sesuatu soal file ini, atau kosongkan buat ringkasan..." : "Type a command, e.g. create a meeting tomorrow at 10..."}
            />
          </div>
          <button className={`rec-btn${recording ? " recording" : ""}`} onClick={toggleRecording} title={recording ? "Berhenti merekam" : "Rekam suara"}>
            <Icon name={recording ? "player-stop" : "microphone"} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default VeraChat;