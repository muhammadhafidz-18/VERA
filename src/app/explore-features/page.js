// src/app/explore-features/page.js
"use client";
import Link from "next/link";
import Icon from "@/lib/Icon";

const LIVE_FEATURES = [
  {
    icon: "message-chatbot",
    title: "Ask VERA",
    body: "Type or talk, in plain language, and get a real answer — not a search bar. VERA looks things up, fills in the details, and takes action across the app on your behalf.",
  },
  {
    icon: "users",
    title: "Employee Directory",
    body: "Every person, role, division, and branch searchable in one place — no more digging through spreadsheets to find who's who.",
  },
  {
    icon: "calendar",
    title: "Meeting Schedule",
    body: "See what's already on the calendar, and get a room and time locked in without leaving the conversation.",
  },
  {
    icon: "ticket",
    title: "Tasks",
    body: "Assign, track, and close out requests with a full history attached to each one — so nothing quietly falls through the cracks.",
  },
];

const UPCOMING_FEATURES = [
  {
    icon: "fingerprint",
    title: "Biometrics Sign In",
    body: "Skip the password. A fingerprint or face scan will be all it takes to get into your workspace, securely.",
  },
  {
    icon: "activity",
    title: "Attendance by VERA",
    body: "Clock in, clock out, or request leave through the same conversation you already use for everything else.",
  },
  {
    icon: "wallet",
    title: "Payroll",
    body: "Don't need your HR or Finance to explain the calculation amount — just ask VERA, and get a clear breakdown on the spot.",
  },
  {
    icon: "list-checks",
    title: "Bulk Approved by VERA",
    body: "Clear a stack of pending approvals in one go — VERA summarizes what you're approving so you can move fast with confidence.",
  },
];

export default function ExploreFeaturesPage() {
  return (
    <div className="features-page">
      <div className="features-header">
        <div className="features-header-brand">
          <img src="/logo-vera.png" alt="VERA" />
          VERA
        </div>
        <Link href="/login" className="features-back-link">
          <Icon name="arrow-left" size={13} /> Back to Sign in
        </Link>
      </div>

      <div className="features-top">
        <div className="features-top-left">
          <div className="features-eyebrow-label">WHAT VERA CAN DO</div>
          <h1>One place to start for everything your workday needs.</h1>
          <p>
            VERA is your assistant for our directory, schedule, tasks and more in a single conversation — it&apos;s
            built to keep growing, taking on more of the busywork so you don&apos;t have to.
          </p>
        </div>

        <div className="features-status-card">
          <div className="features-status-row">
            <span className="dot" /> AVAILABLE NOW
          </div>
          <div className="features-status-icons">
            <span>
              <Icon name="message-chatbot" size={17} />
            </span>
            <span>
              <Icon name="calendar" size={17} />
            </span>
            <span>
              <Icon name="ticket" size={17} />
            </span>
          </div>
          <div className="features-status-caption">Already live inside VERA</div>
        </div>
      </div>

      <div className="features-list-section">
        <div className="features-list-label">CORE FUNCTIONALITY</div>
        <div className="feature-row-list">
          {LIVE_FEATURES.map((f) => (
            <div className="feature-row" key={f.title}>
              <div className="feature-row-icon">
                <Icon name={f.icon} size={19} />
              </div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-list-section upcoming">
        <div className="features-list-label amber">COMING SOON: FUTURE OF VERA</div>
        <div className="feature-row-list">
          {UPCOMING_FEATURES.map((f) => (
            <div className="feature-row" key={f.title}>
              <span className="feature-row-badge">SOON</span>
              <div className="feature-row-icon">
                <Icon name={f.icon} size={19} />
              </div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-cta">
        <h2>Ready to get started?</h2>
        <p>Sign in with your email and password — your menu adjusts automatically to your role.</p>
        <Link href="/login" className="features-cta-btn">
          SIGN IN TO VERA <Icon name="arrow-left" size={13} style={{ transform: "rotate(180deg)" }} />
        </Link>
      </div>
    </div>
  );
}
