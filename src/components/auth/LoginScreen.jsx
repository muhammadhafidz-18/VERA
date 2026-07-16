// src/components/auth/LoginScreen.jsx
"use client";
import { useState } from "react";
import Icon from "@/lib/Icon";
import AuthShell from "./AuthShell";
import { employees } from "@/lib/vera/store";
import { signInWithPassword } from "@/lib/supabase/auth";

export default function LoginScreen({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setLoading(true);
    const { user: authUser, error: authError } = await signInWithPassword(trimmedEmail, password);
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    // Bridge: the employees table isn't wired to Supabase yet (Fase 4), so
    // for now we match the authenticated Supabase user by email against the
    // in-memory employee directory to populate the profile shown in the app.
    // Once Fase 4 lands this should look up `employees` by `auth_user_id`
    // instead.
    const profile = employees.find((emp) => emp.email.toLowerCase() === trimmedEmail);
    if (!profile) {
      setError("Signed in, but no matching employee profile was found. Contact an admin.");
      return;
    }

    onLogin({ ...profile, authUserId: authUser.id });
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
          autoComplete="email"
        />
      </div>

      <label className="login-field-label">Password</label>
      <div className="login-field-wrap">
        <span className="login-field-icon">
          <Icon name="lock" size={15} />
        </span>
        <input
          className="login-field-input"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit(e);
          }}
          autoComplete="current-password"
        />
        <button
          type="button"
          className="login-field-icon-btn"
          onClick={() => setShowPassword((v) => !v)}
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <Icon name={showPassword ? "eye-off" : "eye"} size={15} />
        </button>
      </div>

      <button type="button" className="login-help-row login-help-btn" onClick={onForgotPassword}>
        <Icon name="lock" size={12} /> Forgot your password?
      </button>

      {error && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button type="button" className="login-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
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
