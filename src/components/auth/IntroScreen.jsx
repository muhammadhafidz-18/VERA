// src/components/auth/IntroScreen.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import { speak } from "@/lib/voice";

export default function IntroScreen({ onDone }) {
  const [tapped, setTapped] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);

    const GREETING = "Hi, welcome. I am Vera, your personal assistant. Please continue to enter the system.";
    speak(GREETING, () => setShowContinue(true), "en-US");
    // Fallback in case speech synthesis is unavailable/blocked in this browser
    setTimeout(() => setShowContinue(true), 5000);
  };

  return (
    <div className="intro-shell">
      <div className="intro-glow" />
      <div className="logo-mark-wrap intro-logo">
        <img src="/logo-vera.png" alt="VERA" className="logo-mark" style={{ width: 84 }} />
      </div>
      <div className="intro-title">Hi, I&rsquo;m VERA</div>
      <div className="intro-sub">Your Virtual Employee Resource Assistant</div>

      {!tapped && (
        <button className="intro-tap-btn" onClick={handleTap}>
          <Icon name="microphone" size={16} /> Tap to begin
        </button>
      )}

      {tapped && !showContinue && (
        <div className="intro-speaking">
          <span className="intro-dot" />
          <span className="intro-dot" />
          <span className="intro-dot" />
          Vera is speaking...
        </div>
      )}

      {showContinue && (
        <button className="intro-continue-btn" onClick={onDone}>
          Continue <Icon name="star" size={13} />
        </button>
      )}
    </div>
  );
}
