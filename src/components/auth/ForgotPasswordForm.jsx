// src/components/auth/ForgotPasswordForm.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import AuthShell from "./AuthShell";
import { requestPasswordReset } from "@/lib/supabase/auth";

export default function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: resetError } = await requestPasswordReset(trimmed);
    setLoading(false);

    // Always show the same success state whether or not the email exists —
    // this avoids leaking which emails are registered.
    if (resetError && !resetError.toLowerCase().includes("rate")) {
      setSent(true);
      return;
    }
    if (resetError) {
      setError(resetError);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div className="login-reset-success-icon">
            <Icon name="check" size={22} />
          </div>
          <div className="login-form-title" style={{ marginTop: 14 }}>
            Check your email
          </div>
          <div className="login-form-sub" style={{ marginBottom: 24 }}>
            If an account exists for <b>{email.trim().toLowerCase()}</b>, we&rsquo;ve sent a link to reset your
            password.
          </div>
          <button type="button" className="login-submit-btn" onClick={onBack}>
            Back to Sign in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <button
        type="button"
        className="login-back-btn"
        onClick={() => {
          setError("");
          onBack();
        }}
      >
        <Icon name="arrow-left" size={14} /> Back
      </button>

      <div className="login-form-title">Reset your password</div>
      <div className="login-form-sub">Enter your registered email and we&rsquo;ll send you a reset link.</div>

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
            if (e.key === "Enter") handleSubmit();
          }}
          autoComplete="email"
        />
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button type="button" className="login-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </AuthShell>
  );
}
