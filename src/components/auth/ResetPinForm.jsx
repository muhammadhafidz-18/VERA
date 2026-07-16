// src/components/auth/ResetPinForm.jsx
"use client";
import { useState, useRef } from "react";
import Icon from "@/lib/Icon";
import AuthShell from "./AuthShell";
import PinBoxes from "./PinBoxes";
import { EMPLOYEES } from "@/lib/vera/store";

export default function ResetPinForm({ onBack }) {
  const [mode, setMode] = useState("email"); // "email" | "newpin" | "done"
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [newPin, setNewPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  const handleContinue = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    const user = EMPLOYEES.find((emp) => emp.email.toLowerCase() === trimmed);
    if (!user) {
      setError("Email is not registered.");
      return;
    }
    setError("");
    setMode("newpin");
  };

  const handleResetSubmit = () => {
    if (newPin.some((d) => d === "") || confirmPin.some((d) => d === "")) {
      setError("Please fill in both PIN fields.");
      return;
    }
    if (newPin.join("") !== confirmPin.join("")) {
      setError("PINs do not match. Please try again.");
      return;
    }
    setError("");
    setMode("done");
  };

  return (
    <AuthShell>
      {mode !== "done" && (
        <button
          type="button"
          className="login-back-btn"
          onClick={() => {
            setError("");
            if (mode === "newpin") setMode("email");
            else onBack();
          }}
        >
          <Icon name="arrow-left" size={14} /> Back
        </button>
      )}

      {mode === "email" && (
        <>
          <div className="login-form-title">Reset your PIN</div>
          <div className="login-form-sub">Enter your registered email to continue.</div>

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
                if (e.key === "Enter") handleContinue();
              }}
            />
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="button" className="login-submit-btn" onClick={handleContinue}>
            Continue
          </button>
        </>
      )}

      {mode === "newpin" && (
        <>
          <div className="login-form-title">Set a new PIN</div>
          <div className="login-form-sub">
            For <b>{email.trim().toLowerCase()}</b>
          </div>

          <label className="login-field-label">New PIN</label>
          <PinBoxes values={newPin} onChangeAt={setNewPin} refsArr={newPinRefs} />

          <label className="login-field-label">Confirm PIN</label>
          <PinBoxes values={confirmPin} onChangeAt={setConfirmPin} refsArr={confirmPinRefs} />

          {error && (
            <div className="form-error" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="button" className="login-submit-btn" onClick={handleResetSubmit}>
            Reset PIN
          </button>
        </>
      )}

      {mode === "done" && (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div className="login-reset-success-icon">
            <Icon name="check" size={22} />
          </div>
          <div className="login-form-title" style={{ marginTop: 14 }}>
            PIN updated
          </div>
          <div className="login-form-sub" style={{ marginBottom: 24 }}>
            Your PIN has been reset. Please sign in with your new PIN.
          </div>
          <button type="button" className="login-submit-btn" onClick={onBack}>
            Back to Sign in
          </button>
        </div>
      )}
    </AuthShell>
  );
}
