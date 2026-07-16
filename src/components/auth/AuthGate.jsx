// src/components/auth/AuthGate.jsx
"use client";
import { useState } from "react";
import LoginScreen from "./LoginScreen";
import ResetPinForm from "./ResetPinForm";

export default function AuthGate({ onLogin }) {
  const [screen, setScreen] = useState("login"); // "login" | "reset"
  if (screen === "reset") {
    return <ResetPinForm onBack={() => setScreen("login")} />;
  }
  return <LoginScreen onLogin={onLogin} onForgotPin={() => setScreen("reset")} />;
}
