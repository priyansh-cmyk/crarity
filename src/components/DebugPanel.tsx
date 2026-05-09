import { useState } from "react";
import { useNavigate } from "react-router-dom";

type BtnDef = { label: string; path: string };

const SECTIONS: { title: string; buttons: BtnDef[] }[] = [
  {
    title: "Assessment Flow (in order)",
    buttons: [
      { label: "1. Role Intro", path: "/assessment/academic-counselor?debug=true" },
      { label: "2. About / Game Overview", path: "/assessment/academic-counselor/about?debug=true" },
      { label: "3. Start / Intake Form", path: "/assessment/academic-counselor/start?debug=true" },
      { label: "4. Game 1 - Pick Your Shot", path: "/assessment/academic-counselor/game-1?debug=true" },
      { label: "5. Filter 1 - Experience", path: "/assessment/academic-counselor/filter-1?debug=true" },
      { label: "6. Game 2 - Say It Like You Mean It", path: "/assessment/academic-counselor/game-2?debug=true" },
      { label: "7. Game 3 - Beyond The Student", path: "/assessment/academic-counselor/game-3?debug=true" },
      { label: "8. Filter 2 - Weekend Avail.", path: "/assessment/academic-counselor/filter-2?debug=true" },
      { label: "9. Game 4 - Handle the Heat", path: "/assessment/academic-counselor/game-4?debug=true" },
      { label: "10. Filter 3 - Start Timeline", path: "/assessment/academic-counselor/filter-3?debug=true" },
      { label: "11. Results", path: "/assessment/academic-counselor/results?debug=true" },
      { label: "12. Profile", path: "/assessment/academic-counselor/profile?debug=true" },
    ],
  },
  {
    title: "Results Preview",
    buttons: [
      { label: "Elite: 95/100", path: "/assessment/academic-counselor/results?debug=true&score=95" },
      { label: "Qualified: 82/100", path: "/assessment/academic-counselor/results?debug=true&score=82" },
      { label: "Qualified: 75/100", path: "/assessment/academic-counselor/results?debug=true&score=75" },
      { label: "On Hold: 65/100", path: "/assessment/academic-counselor/results?debug=true&score=65" },
      { label: "Rejected: 45/100", path: "/assessment/academic-counselor/results?debug=true&score=45" },
    ],
  },
  {
    title: "Candidate Auth & Dashboard",
    buttons: [
      { label: "Sign Up Page", path: "/assessment/academic-counselor/signup?debug=true" },
      { label: "Login Page", path: "/assessment/academic-counselor/login?debug=true" },
      { label: "Dashboard - Looking", path: "/candidate/dashboard?debug=true&status=looking" },
      { label: "Dashboard - Hired", path: "/candidate/dashboard?debug=true&status=hired" },
      { label: "Dashboard - On Break", path: "/candidate/dashboard?debug=true&status=break" },
    ],
  },
];

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Show in dev, in Lovable preview, or when ?debug=true is in the URL
  const isLovablePreview =
    typeof window !== "undefined" &&
    /lovable\.(app|dev)$/.test(window.location.hostname);
  const forceDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "true";
  if (!import.meta.env.DEV && !isLovablePreview && !forceDebug) return null;

  const btnStyle: React.CSSProperties = {
    width: "100%",
    background: "#262626",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 12,
    fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    marginBottom: 4,
    textAlign: "left",
    transition: "background 120ms, color 120ms",
  };

  const resetAll = () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("debug-"))
      .forEach((k) => localStorage.removeItem(k));
    alert("Debug data cleared");
  };

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
      <style>{`
        .dbg-btn:hover { background: #C5E831 !important; color: #1a1a1a !important; }
      `}</style>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #C5E831",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
          }}
        >
          🛠️ Debug Tools
        </button>
      ) : (
        <div
          style={{
            background: "#1a1a1a",
            color: "#fff",
            padding: 16,
            borderRadius: 10,
            width: 320,
            maxHeight: 600,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            border: "1px solid #C5E831",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#C5E831" }}>🛠️ Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                {section.title}
              </p>
              {section.buttons.map((b) => (
                <button
                  key={b.path}
                  className="dbg-btn"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(b.path);
                  }}
                  style={btnStyle}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ))}

          <div style={{ borderTop: "1px solid #333", paddingTop: 12 }}>
            <p style={{ fontSize: 10, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Reset
            </p>
            <button
              className="dbg-btn"
              onClick={resetAll}
              style={{ ...btnStyle, borderColor: "#7a2222", background: "#3a1a1a" }}
            >
              Reset All Debug Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
