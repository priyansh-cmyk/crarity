import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin-auth";

type State = "checking" | "ok" | "denied";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;

    const verify = async (userId: string | undefined) => {
      if (!userId) {
        if (!cancelled) setState("denied");
        return;
      }
      const ok = await checkIsAdmin(userId);
      if (!cancelled) setState(ok ? "ok" : "denied");
    };

    // Set up listener BEFORE fetching session (Supabase best practice)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      verify(session?.user?.id);
    });

    supabase.auth.getSession().then(({ data }) => verify(data.session?.user?.id));

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6b6b", fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }
  if (state === "denied") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
