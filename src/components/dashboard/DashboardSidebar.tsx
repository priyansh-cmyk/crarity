import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Folder,
  Users,
  Calendar,
  Settings as SettingsIcon,
  Plus,
  type LucideIcon,
} from "lucide-react";

/* ============================== Tokens ================================= */
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

/* ============================== Types ================================== */
type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string;
};

type NavSection = {
  key: string;
  label: string;
  items: NavItem[];
};

/* ============================== Data =================================== */
const SECTIONS: NavSection[] = [
  {
    key: "hiring",
    label: "HIRING",
    items: [
      { key: "create-role", label: "Create Role", icon: Plus, to: "/roles/create" },
      { key: "roles", label: "Roles", icon: Folder, to: "/roles" },
      { key: "candidates", label: "Candidates", icon: Users, to: "/candidates" },
      { key: "interviews", label: "Interviews", icon: Calendar, to: "/interviews" },
    ],
  },
  {
    key: "account",
    label: "ACCOUNT",
    items: [
      { key: "settings", label: "Settings", icon: SettingsIcon, to: "/settings" },
    ],
  },
];

/* ============================== Component ============================== */
export type DashboardSidebarProps = {
  /** When true, plays the slide-in + stagger animation on mount */
  animateIn?: boolean;
};

const DashboardSidebar = ({ animateIn = false }: DashboardSidebarProps) => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (to: string) => {
    // Exact-match for /roles so it doesn't light up on /roles/create
    if (to === "/roles") return path === "/roles";
    return path === to || path.startsWith(to + "/");
  };

  const delayFor = (idx: number) => (animateIn ? idx * 50 : 0);

  const itemAnim = (idx: number): React.CSSProperties =>
    animateIn
      ? {
          opacity: 0,
          transform: "translateY(4px)",
          animation: `crSidebarItem 360ms ${ease} forwards`,
          animationDelay: `${delayFor(idx)}ms`,
        }
      : {};

  // Flat index across sections for stagger animation continuity
  let flatIdx = 0;

  return (
    <aside
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
        overflowY: "auto",
        ...(animateIn
          ? { animation: `crSidebarSlide 400ms ${ease} both` }
          : {}),
      }}
    >
      <style>{`
        @keyframes crSidebarSlide {
          from { transform: translateX(-280px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes crSidebarItem {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Logo */}
      <Link
        to="/roles"
        style={{
          display: "block",
          padding: "0 24px",
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.02em",
          textDecoration: "none",
        }}
      >
        crarity
      </Link>

      {/* SECTIONS */}
      {SECTIONS.map((section, sIdx) => (
        <div key={section.key} style={{ marginTop: 32 }}>
          <div
            style={{
              padding: "0 24px",
              marginBottom: 12,
              fontSize: 11,
              fontWeight: 600,
              color: T.muted,
              letterSpacing: "0.1em",
              fontFamily: T.sans,
              textTransform: "uppercase",
            }}
          >
            {section.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {section.items.map((it) => {
              const idx = flatIdx++;
              return (
                <div key={it.key} style={itemAnim(idx)}>
                  <NavRow item={it} active={isActive(it.to)} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
};

/* ============================== Subparts =============================== */
const NavRow = ({ item, active }: { item: NavItem; active: boolean }) => {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;

  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 24px",
    // Maintain text alignment when active border is present
    paddingLeft: active ? 21 : 24,
    borderLeft: active ? `3px solid ${T.green}` : "3px solid transparent",
    background: active ? T.greenSoft : "transparent",
    color: active || hover ? T.text : T.dim,
    fontWeight: active ? 600 : 400,
    fontSize: 15,
    fontFamily: T.sans,
    borderRadius: 0,
    textAlign: "left",
    textDecoration: "none",
    transition: `color 120ms ${ease}, border-color 120ms ${ease}, background 120ms ${ease}`,
  };

  return (
    <Link
      to={item.to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={style}
    >
      <Icon size={20} strokeWidth={2} color={active ? T.green : undefined} />
      <span style={{ flex: 1 }}>{item.label}</span>
    </Link>
  );
};

export default DashboardSidebar;
