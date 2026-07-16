// src/app/reset-password/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Icon from "@/lib/Icon";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase fires PASSWORD_RECOVERY once it parses the recovery token
    // from the URL. If that never fires and there's no session either, the
    // link was invalid or already used.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setReady((r) => {
        if (!r) setInvalidLink(true);
        return r;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    setDone(true);
  };

  if (invalidLink) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div className="login-form-title">Link expired</div>
          <div className="login-form-sub" style={{ marginBottom: 24 }}>
            This reset link is invalid or has expired. Please request a new one.
          </div>
          <button type="button" className="login-submit-btn" onClick={() => router.replace("/login")}>
            Back to Sign in
          </button>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div className="login-reset-success-icon">
            <Icon name="check" size={22} />
          </div>
          <div className="login-form-title" style={{ marginTop: 14 }}>
            Password updated
          </div>
          <div className="login-form-sub" style={{ marginBottom: 24 }}>
            Your password has been reset. Please sign in with your new password.
          </div>
          <button type="button" className="login-submit-btn" onClick={() => router.replace("/login")}>
            Back to Sign in
          </button>
        </div>
      </AuthShell>
    );
  }

  if (!ready) return null;

  return (
    <AuthShell>
      <div className="login-form-title">Set a new password</div>
      <div className="login-form-sub">Choose a new password for your account.</div>

      <label className="login-field-label">New password</label>
      <div className="login-field-wrap">
        <span className="login-field-icon">
          <Icon name="lock" size={15} />
        </span>
        <input
          className="login-field-input"
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
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

      <label className="login-field-label">Confirm new password</label>
      <div className="login-field-wrap">
        <span className="login-field-icon">
          <Icon name="lock" size={15} />
        </span>
        <input
          className="login-field-input"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button type="button" className="login-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </AuthShell>
  );
}
