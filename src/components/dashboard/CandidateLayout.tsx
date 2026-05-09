import { useState } from "react";
import { Menu, X, LogOut, Home, User, Settings as SettingsIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CandidateSidebar from "./CandidateSidebar";
import { useAuth } from "@/contexts/AuthContext";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  green: "#C5E831",
  greenSoft: "rgba(197, 232, 49, 0.12)",
};

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    { label: "Dashboard", icon: Home, to: "/candidate/dashboard" },
    { label: "Profile", icon: User, to: "/candidate/profile" },
    { label: "Settings", icon: SettingsIcon, to: "/candidate/settings" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf8",
        fontFamily: T.sans,
        color: T.text,
      }}
    >
      <style>{`
        .cr-cand-mobile-bar { display: none; }
        .cr-cand-main { margin-left: 280px; padding: 48px; }
        @media (max-width: 768px) {
          .cr-cand-mobile-bar { display: flex !important; }
          .cr-cand-main { margin-left: 0 !important; padding: 24px !important; padding-top: 80px !important; }
        }
      `}</style>

      <CandidateSidebar />

      {/* Mobile top bar */}
      <div
        className="cr-cand-mobile-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          padding: "0 16px",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 25,
        }}
      >
        <Link to="/candidate/dashboard" style={{ fontSize: 18, fontWeight: 700, color: T.text, textDecoration: "none", letterSpacing: "-0.02em" }}>
          crarity
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{ background: "transparent", border: "none", padding: 8, cursor: "pointer", color: T.text }}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              maxWidth: "85vw",
              background: "#fff",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 24 }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>crarity</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.text }} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {items.map((it) => {
                const active = pathname === it.to;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 20px",
                      borderLeft: active ? `3px solid ${T.green}` : "3px solid transparent",
                      paddingLeft: active ? 17 : 20,
                      background: active ? T.greenSoft : "transparent",
                      color: T.text,
                      fontWeight: active ? 600 : 400,
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    <it.icon size={20} color={active ? T.green : undefined} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate("/assessment/academic-counselor/login", { replace: true });
              }}
              style={{
                margin: "0 20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 99,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: T.text,
                cursor: "pointer",
              }}
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}

      <main className="cr-cand-main" style={{ minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
