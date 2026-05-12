import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Settings as SettingsIcon, LogOut, Menu, X, ClipboardCheck, LayoutDashboard, BarChart3, Building2, Activity } from "lucide-react";
import { adminLogout } from "@/lib/admin-auth";
import { supabase } from "@/integrations/supabase/client";

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  bg: "#f7f6f3",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/candidates", label: "Candidates", icon: Users },
  { to: "/admin/scores", label: "Scoring Queue", icon: ClipboardCheck, badgeKey: "pendingReviews" as const },
  { to: "/admin/employers", label: "Employers", icon: Building2 },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/health", label: "Health", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_sessions")
        .select("scores")
        .eq("completed", true);
      if (cancelled) return;
      const count = (data || []).filter((r: any) => {
        const st = r?.scores?.review?.status;
        return !st || st === "pending";
      }).length;
      setPendingReviews(count);
    })();
    return () => { cancelled = true; };
  }, []);

  const badges: Record<string, number> = { pendingReviews };

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login");
  };

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  const SidebarInner = (
    <div
      style={{
        width: 240,
        background: T.bg,
        borderRight: `1px solid ${T.border}`,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: T.sans,
      }}
    >
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CrarityIcon size={28} />
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Crarity Admin</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                background: active ? "#fff" : "transparent",
                borderLeft: active ? `3px solid ${T.green}` : "3px solid transparent",
                color: active ? T.text : T.dim,
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "background 150ms",
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background: T.green, color: T.text, fontSize: 11, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 999, minWidth: 22, textAlign: "center",
                }}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        style={{
          margin: 12,
          padding: "10px 14px",
          borderRadius: 8,
          border: `1px solid ${T.border}`,
          background: "#fff",
          color: T.text,
          fontFamily: T.sans,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <LogOut size={14} /> Logout
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff", fontFamily: T.sans }}>
      {/* Desktop sidebar */}
      <div className="admin-sidebar-desktop" style={{ position: "sticky", top: 0, height: "100vh" }}>
        {SidebarInner}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 50,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
            {SidebarInner}
          </div>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        <div
          className="admin-mobile-bar"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.text }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CrarityIcon size={22} />
            <span style={{ fontWeight: 700 }}>Crarity Admin</span>
          </div>
          <span style={{ width: 20 }} />
        </div>
        <div style={{ padding: 32 }}>{children}</div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none; }
          .admin-mobile-bar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function CrarityIcon({ size = 28 }: { size?: number }) {
  // 4-quadrant logo mark: each shape is a square with a concave
  // quarter-circle cutout at the corner facing the center.
  // ViewBox: 28x28, center at (14,14), quadrant width 10, radius 5.
  const r = size;
  return (
    <svg
      width={r}
      height={r}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" rx="6" fill="#C5E831" />
      {/* Top-left */}
      <path d="M4 4 L14 4 L14 9 A5 5 0 0 0 9 14 L4 14 Z" fill="#1a1a1a" />
      {/* Top-right */}
      <path d="M24 4 L24 14 L19 14 A5 5 0 0 0 14 9 L14 4 Z" fill="#1a1a1a" />
      {/* Bottom-left */}
      <path d="M4 24 L4 14 L9 14 A5 5 0 0 0 14 19 L14 24 Z" fill="#1a1a1a" />
      {/* Bottom-right */}
      <path d="M24 24 L14 24 L14 19 A5 5 0 0 0 19 14 L24 14 Z" fill="#1a1a1a" />
    </svg>
  );
}
