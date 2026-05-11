/**
 * StagingNav — floating page-jumper, staging only.
 * A fixed pill button in the bottom-right corner opens a panel with every
 * route in the app grouped by section. Click any link to navigate instantly.
 * Completely absent from production (VITE_APP_ENV !== "staging").
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, X, ChevronRight } from "lucide-react";

const IS_STAGING = import.meta.env.VITE_APP_ENV === "staging";

interface NavItem {
  label: string;
  path: string;
  note?: string; // small grey annotation
}

interface NavGroup {
  group: string;
  color: string;
  items: NavItem[];
}

const ROUTES: NavGroup[] = [
  {
    group: "Assessment flow",
    color: "#C5E831",
    items: [
      { label: "Landing", path: "/assessment/academic-counselor" },
      { label: "About", path: "/assessment/academic-counselor/about" },
      { label: "Start / intake", path: "/assessment/academic-counselor/start" },
      { label: "Game 1 — MCQ", path: "/assessment/academic-counselor/game-1" },
      { label: "Game 2 — Scenario", path: "/assessment/academic-counselor/game-2" },
      { label: "Game 3 — Pitch", path: "/assessment/academic-counselor/game-3" },
      { label: "Game 4 — Follow-up", path: "/assessment/academic-counselor/game-4" },
      { label: "Filter 1", path: "/assessment/academic-counselor/filter-1" },
      { label: "Filter 2", path: "/assessment/academic-counselor/filter-2" },
      { label: "Filter 3", path: "/assessment/academic-counselor/filter-3" },
      { label: "Results", path: "/assessment/academic-counselor/results" },
      { label: "Profile builder", path: "/assessment/academic-counselor/profile" },
    ],
  },
  {
    group: "Candidate",
    color: "#a8d8f0",
    items: [
      { label: "Sign up", path: "/assessment/academic-counselor/signup" },
      { label: "Login", path: "/assessment/academic-counselor/login" },
      { label: "Dashboard", path: "/candidate/dashboard" },
      { label: "Profile", path: "/candidate/profile" },
      { label: "Settings", path: "/candidate/settings" },
      { label: "Status tracker", path: "/assessment/track/PASTE_SESSION_ID", note: "replace ID" },
    ],
  },
  {
    group: "Employer",
    color: "#f0c4a8",
    items: [
      { label: "Home / marketing", path: "/" },
      { label: "Login", path: "/login" },
      { label: "Onboarding", path: "/onboarding" },
      { label: "Roles", path: "/roles" },
      { label: "Create role", path: "/roles/new" },
      { label: "Candidates", path: "/candidates" },
      { label: "Interviews", path: "/interviews" },
      { label: "Settings", path: "/settings" },
    ],
  },
  {
    group: "Admin",
    color: "#e8a8f0",
    items: [
      { label: "Login", path: "/admin/login" },
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Candidates", path: "/admin/candidates" },
      { label: "Scoring queue", path: "/admin/scores" },
      { label: "Employers", path: "/admin/employers" },
      { label: "Analytics", path: "/admin/analytics" },
      { label: "Health", path: "/admin/health" },
      { label: "Settings", path: "/admin/settings" },
    ],
  },
  {
    group: "Public",
    color: "#a8f0c8",
    items: [
      { label: "Privacy", path: "/privacy" },
      { label: "Terms", path: "/terms" },
    ],
  },
];

export default function StagingNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!IS_STAGING) return null;

  const go = (path: string) => {
    if (path.includes("PASTE_SESSION_ID")) return; // don't nav placeholder
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99990,
            background: "rgba(0,0,0,0.25)",
          }}
        />
      )}

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 64,
            right: 20,
            zIndex: 99995,
            width: 300,
            maxHeight: "70vh",
            overflowY: "auto",
            background: "#1a1a1a",
            borderRadius: 16,
            border: "1px solid #2e2e2e",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
            padding: "12px 0",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "4px 16px 12px",
              borderBottom: "1px solid #2e2e2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#C5E831", letterSpacing: "0.06em" }}>
              PAGE JUMPER
            </span>
            <span style={{ fontSize: 11, color: "#555" }}>
              {location.pathname}
            </span>
          </div>

          {ROUTES.map((section) => (
            <div key={section.group}>
              {/* Section label */}
              <div
                style={{
                  padding: "10px 16px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: section.color,
                  textTransform: "uppercase",
                }}
              >
                {section.group}
              </div>

              {/* Items */}
              {section.items.map((item) => {
                const isCurrent = location.pathname === item.path;
                const isPlaceholder = item.path.includes("PASTE_SESSION_ID");
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    disabled={isPlaceholder}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      background: isCurrent ? "#2a2a2a" : "transparent",
                      border: "none",
                      padding: "7px 16px",
                      cursor: isPlaceholder ? "default" : "pointer",
                      textAlign: "left",
                      color: isCurrent ? "#fff" : isPlaceholder ? "#444" : "#ccc",
                      fontSize: 13,
                      fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
                      transition: "background 100ms",
                      opacity: isPlaceholder ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent && !isPlaceholder)
                        (e.currentTarget as HTMLButtonElement).style.background = "#222";
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent)
                        (e.currentTarget as HTMLButtonElement).style.background = isCurrent ? "#2a2a2a" : "transparent";
                    }}
                  >
                    {isCurrent && (
                      <ChevronRight size={12} color={section.color} style={{ flexShrink: 0 }} />
                    )}
                    {!isCurrent && <span style={{ width: 12, flexShrink: 0 }} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.note && (
                      <span style={{ fontSize: 10, color: "#555", flexShrink: 0 }}>{item.note}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Trigger pill */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 99996,
          background: open ? "#C5E831" : "#1a1a1a",
          color: open ? "#1a1a1a" : "#C5E831",
          border: "none",
          borderRadius: 99,
          padding: "9px 16px",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          letterSpacing: "0.03em",
          transition: "background 150ms, color 150ms",
        }}
      >
        {open ? <X size={13} /> : <Map size={13} />}
        {open ? "Close" : "Pages"}
      </button>
    </>
  );
}
