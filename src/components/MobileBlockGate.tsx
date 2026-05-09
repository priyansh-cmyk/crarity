import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileBlockOverlay, { isMobileDevice } from "./MobileBlockOverlay";

/**
 * Renders a full-screen blocking overlay if the user is on a mobile device.
 * Drop into the top of any assessment page: <MobileBlockGate />
 */
export default function MobileBlockGate({ redirectTo = "/assessment/academic-counselor" }: { redirectTo?: string }) {
  const [blocked, setBlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setBlocked(isMobileDevice());
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!blocked) return null;
  return <MobileBlockOverlay onClose={() => navigate(redirectTo)} />;
}
