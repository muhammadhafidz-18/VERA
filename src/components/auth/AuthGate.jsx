// src/components/auth/AuthGate.jsx
"use client";
import { useState } from "react";
import LoginScreen from "./LoginScreen";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function AuthGate({ onLogin }) {
  const [screen, setScreen] = useState("login"); // "login" | "forgot-password"
  if (screen === "forgot-password") {
    return <ForgotPasswordForm onBack={() => setScreen("login")} />;
  }
  return <LoginScreen onLogin={onLogin} onForgotPassword={() => setScreen("forgot-password")} />;
}
