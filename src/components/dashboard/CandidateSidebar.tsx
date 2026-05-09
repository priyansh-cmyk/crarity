import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, Settings as SettingsIcon, LogOut, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  muted: "#aaaaaa",
  border: "#e8e3d8",
  green: "#C5E831",
  greenSoft: "rgba(197, 232, 49, 0.12)",
};
const ease = "cubic-bezier(0.4, 0, 0.2, 1)";

type NavItem = { key: string; label: string; icon: LucideIcon; to: string };

const ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: Home, to: "/candidate/dashboard" },
  { key: "profile", label: "Profile", icon: User, to: "/candidate/profile" },
  { key: "settings", label: "Settings", icon: SettingsIcon, to: "/candidate/settings" },
];

export default function CandidateSidebar({ animateIn = false }: { animateIn?: boolean }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const onLogout = async () => {
    await signOut();
    navigate("/assessment/academic-counselor/login", { replace: true });
  };

  return (
    <aside
      className="cr-cand-sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 280,
        height: "100vh",
        background: "#ffffff",
        borderRight: `1px solid ${T.border}`,
        padding: "32px 0",
        fontFamily: T.sans,
        color: T.text,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        ...(animateIn ? { animation: `crSidebarSlide 400ms ${ease} both` } : {}),
      }}
    >
      <style>{`
        @keyframes crSidebarSlide {
          from { transform: translateX(-280px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 768px) {
          .cr-cand-sidebar { display: none !important; }
        }
      `}</style>

      <Link
        to="/candidate/dashboard"
        style={{
          display: "block",
          padding: "0 24px",
          marginBottom: 32,
          fontSize: 20,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.02em",
          textDecoration: "none",
        }}
      >
        crarity
      </Link>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {ITEMS.map((it) => (
          <NavRow key={it.key} item={it} active={isActive(it.to)} />
        ))}
      </div>

      <button
        onClick={onLogout}
        style={{
          margin: "0 24px",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "transparent",
          border: `1px solid ${T.border}`,
          borderRadius: 99,
          padding: "10px 16px",
          fontFamily: T.sans,
          fontSize: 14,
          fontWeight: 500,
          color: T.text,
          cursor: "pointer",
        }}
      >
        <LogOut size={16} /> Log out
      </button>
    </aside>
  );
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 24px",
        paddingLeft: active ? 21 : 24,
        borderLeft: active ? `3px solid ${T.green}` : "3px solid transparent",
        background: active ? T.greenSoft : "transparent",
        color: active || hover ? T.text : T.dim,
        fontWeight: active ? 600 : 400,
        fontSize: 15,
        fontFamily: T.sans,
        textDecoration: "none",
        transition: `color 120ms ${ease}, background 120ms ${ease}`,
      }}
    >
      <Icon size={20} strokeWidth={2} color={active ? T.green : undefined} />
      <span style={{ flex: 1 }}>{item.label}</span>
    </Link>
  );
}
