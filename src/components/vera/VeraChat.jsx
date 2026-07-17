// src/components/vera/VeraChat.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "@/lib/Icon";
import { speak, warmUpVoices } from "@/lib/voice";
import { clearSession, loadSession } from "@/lib/session";
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

export default function VeraChat({ onLogout }) {
  const greeting = getVeraGreeting(loadSession()?.user?.name);
  const [messages, setMessages] = useState(() => loadVeraChatHistory() || [{ role: "assistant", text: greeting }]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

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

  const resetChatSilently = () => {
    const fresh = [{ role: "assistant", text: greeting }];
    setMessages(fresh);
    try {
      sessionStorage.setItem(VERA_CHAT_HISTORY_KEY, JSON.stringify(fresh));
    } catch (err) {}
  };

  const doLogout = () => {
    clearSession();
    if (onLogout) onLogout();
  };

  const sendText = async (text, viaVoice) => {
    if (!text || !text.trim() || thinking) return;

    // Deterministic shortcut: if V.E.R.A just asked to confirm logout/reset
    // and this message is a bare "yes", act on it directly — no AI round-trip.
    const lastMsg = messages[messages.length - 1];
    const isAffirmative = VERA_AFFIRMATIVE_PATTERN.test(text.trim());
    if (lastMsg && lastMsg.role === "assistant" && isAffirmative) {
      if (VERA_LOGOUT_CONFIRM_QUESTION_PATTERN.test(lastMsg.text)) {
        const confirmMsg = "Baik, kamu akan logout sekarang.";
        setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: confirmMsg }]);
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

    const userMsg = { role: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    const history = nextMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    }));

    try {
      const res = await fetch("/api/vera/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      let reply = sanitizeVeraReply(data.text);
      let opType = data.dbOperationType;
      if (VERA_RAW_DATA_PATTERN.test(reply) || VERA_META_PATTERN.test(reply)) {
        reply = "Maaf, saya sedang kesulitan mengambil data itu. Coba tanyakan lagi sebentar lagi, ya.";
        opType = null;
      }
      setMessages((m) => [...m, { role: "assistant", text: reply, opType }]);
      if (viaVoice) speak(reply);

      if (data.resetRequested) resetChatSilently();
      if (data.logoutRequested) setTimeout(doLogout, 1600);
    } catch (err) {
      const fallback = "Maaf, terjadi kendala koneksi ke V.E.R.A. Coba lagi sebentar.";
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
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);
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
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) sendText(transcript, true);
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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 105px)", maxWidth: 720, width: "100%", margin: "0 auto" }}>
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
                <div>{m.text}</div>
                {m.opType && <span className={`op-badge ${m.opType.toLowerCase()}`}>{m.opType}</span>}
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
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a command, e.g. create a meeting tomorrow at 10..."
          />
          <button className={`rec-btn${recording ? " recording" : ""}`} onClick={toggleRecording} title={recording ? "Berhenti merekam" : "Rekam suara"}>
            <Icon name={recording ? "player-stop" : "microphone"} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
