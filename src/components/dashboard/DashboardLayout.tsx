import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";

type Props = {
  children: React.ReactNode;
};

/**
 * Shared shell for all dashboard routes.
 *
 * - Animates the sidebar in once per session, when the user first lands on a
 *   dashboard route after completing signup (signaled via location state
 *   { fromSignup: true } or sessionStorage flag "crarity:firstDashboardEntry").
 * - Cross-fades the main content area when the route changes for a smooth
 *   transition between dashboard pages.
 */
const DashboardLayout = ({ children }: Props) => {
  const location = useLocation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const state = (location.state as { fromSignup?: boolean } | null) ?? null;
    const flag = sessionStorage.getItem("crarity:firstDashboardEntry");
    if (state?.fromSignup || flag === "1") {
      setAnimateIn(true);
      sessionStorage.removeItem("crarity:firstDashboardEntry");
    }
  }, [location.state]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf8",
        fontFamily: '"Satoshi", ui-sans-serif, system-ui, sans-serif',
        color: "#1a1a1a",
      }}
    >
      <style>{`
        @keyframes crRouteFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <DashboardSidebar animateIn={animateIn} />
      <main
        key={location.pathname}
        style={{
          marginLeft: 280,
          minHeight: "100vh",
          padding: 48,
          animation: "crRouteFade 200ms cubic-bezier(0.4, 0, 0.2, 1) both",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
