import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  children: ReactNode;
  /** Where to send unauthenticated users. Defaults to /onboarding. */
  redirectTo?: string;
};

const ProtectedRoute = ({ children, redirectTo = "/onboarding" }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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
