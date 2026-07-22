// src/components/auth/AuthShell.jsx
import Icon from "@/lib/Icon";

export default function AuthShell({ children }) {
  return (
    <div className="login-shell">
      <div className="login-card-wrap">
        <div className="login-brand-panel">
          <video className="login-brand-video" src="/back-video-login.mp4" autoPlay loop muted playsInline />
          <div className="login-brand-overlay" />
          <div className="login-brand-content">
            <div>
              <div className="logo-mark-wrap" style={{ marginBottom: 26 }}>
                <img src="/logo-vera.png" alt="VERA" className="logo-mark" style={{ width: 44 }} />
              </div>
              <div className="login-brand-title">V.E.R.A</div>
              <div className="login-brand-desc">
                Virtual Employee Resource Assistant — One command to simplify your daily routine and get
                things done.
              </div>
            </div>
            <div className="login-brand-footer">Sign in with your email and Password. Menu access adjusts automatically to your role.</div>
          </div>
        </div>
        <div className="login-form-panel">{children}</div>
      </div>
    </div>
  );
}
