// src/components/auth/LoginScreen.jsx
"use client";
import { useState, useRef } from "react";
import Icon from "@/lib/Icon";
import AuthShell from "./AuthShell";
import { EMPLOYEES } from "@/lib/vera/store";

// Demo-only validation, ported as-is from the HTML prototype. TODO: replace
// with real Supabase Auth once migration Fase 2 starts — this is NOT secure
// (plaintext PIN check against an in-memory list) and must not stay this way
// in production.
const DEFAULT_PIN = "123456";
const AUTH_PINS = { "vaulthos@vaulthos.com": "123456" };

export default function LoginScreen({ onLogin, onForgotPin }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const pinRefs = useRef([]);

  const handlePinChange = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    if (val && i < 5) pinRefs.current[i + 1]?.focus();
  };

  const handlePinKeyDown = (i, e) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) pinRefs.current[i - 1]?.focus();
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (pin.some((d) => d === "")) {
      setError("Please enter your 6-digit PIN.");
      return;
    }

    const user = EMPLOYEES.find((emp) => emp.email.toLowerCase() === trimmedEmail);
    if (!user) {
      setError("Email is not registered.");
      return;
    }

    const enteredPin = pin.join("");
    const validPin = AUTH_PINS[trimmedEmail] || DEFAULT_PIN;
    if (enteredPin !== validPin) {
      setError("Incorrect PIN.");
      return;
    }

    setError("");
    onLogin(user);
  };

  return (
    <AuthShell>
      <div className="login-form-title">Welcome back</div>
      <div className="login-form-sub">Sign in to continue to your workspace.</div>

      <label className="login-field-label">Email</label>
      <div className="login-field-wrap">
        <span className="login-field-icon">
          <Icon name="address-book" size={15} />
        </span>
        <input
          className="login-field-input"
          type="email"
          placeholder="you@vaulthos.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit(e);
          }}
        />
      </div>

      <label className="login-field-label">PIN</label>
      <div className="login-pin-row">
        {pin.map((d, i) => (
          <input
            key={i}
            ref={(el) => (pinRefs.current[i] = el)}
            className="login-pin-box"
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handlePinChange(i, e.target.value)}
            onKeyDown={(e) => {
              handlePinKeyDown(i, e);
              if (e.key === "Enter") handleSubmit(e);
            }}
          />
        ))}
      </div>

      <button type="button" className="login-help-row login-help-btn" onClick={onForgotPin}>
        <Icon name="lock" size={12} /> Reset forgotten PIN / Need help?
      </button>

      {error && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button type="button" className="login-submit-btn" onClick={handleSubmit}>
        Sign in
      </button>

      <div className="login-divider">
        <span>or</span>
      </div>

      <div className="login-signup-row">
        New to V.E.R.A?{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>
          Explore our Features
        </a>{" "}
        ·{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>
          Sign Up for an Account
        </a>
      </div>
    </AuthShell>
  );
}
