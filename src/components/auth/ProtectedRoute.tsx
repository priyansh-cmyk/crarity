import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const IS_STAGING =
  import.meta.env.VITE_APP_ENV === "staging" ||
  window.location.hostname.includes("staging") ||
  window.location.hostname.includes("crarity-git-staging");

type Props = {
  children: ReactNode;
  /** Where to send unauthenticated users. Defaults to /onboarding. */
  redirectTo?: string;
};

const ProtectedRoute = ({ children, redirectTo = "/onboarding" }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // On staging let everything through so you can browse without signing in
  if (IS_STAGING) return <>{children}</>;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fafaf8",
        }}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
