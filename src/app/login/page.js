// src/app/login/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/auth/AuthGate";
import IntroScreen from "@/components/auth/IntroScreen";
import { loadSession, saveSession } from "@/lib/session";
import { warmUpVoices } from "@/lib/voice";

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState("login"); // "login" | "intro" | "dashboard"
  const [fading, setFading] = useState(false);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    warmUpVoices();
    const existingSession = loadSession();
    if (existingSession) {
      setStage(existingSession.stage);
      setUser(existingSession.user);
      if (existingSession.stage === "dashboard") {
        router.replace("/vera");
        return;
      }
    }
    setHydrated(true);
  }, [router]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setStage("intro");
    saveSession({ user: loggedInUser, stage: "intro" });
  };

  const handleIntroDone = () => {
    setFading(true);
    setTimeout(() => {
      saveSession({ user, stage: "dashboard" });
      router.replace("/vera");
    }, 400);
  };

  if (!hydrated) return null;

  if (stage === "login") return <AuthGate onLogin={handleLogin} />;

  if (stage === "intro") {
    return (
      <div style={{ opacity: fading ? 0 : 1, transition: "opacity .4s ease" }}>
        <IntroScreen onDone={handleIntroDone} />
      </div>
    );
  }

  return null;
}
