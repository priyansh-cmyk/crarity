import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Provides a consistent 300ms fade-out → navigate → fade-in transition
 * for the assessment flow.
 *
 * Usage:
 *   const { fadeNavigate, pageStyle } = useFadeNavigate();
 *   <div style={pageStyle}>...</div>
 *   <button onClick={() => fadeNavigate("/next")}>Next</button>
 */
export function useFadeNavigate(durationMs = 300) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 20);
    return () => window.clearTimeout(t);
  }, []);

  const fadeNavigate = useCallback(
    (to: string) => {
      setVisible(false);
      window.setTimeout(() => navigate(to), durationMs);
    },
    [navigate, durationMs],
  );

  const fadeRun = useCallback(
    async (fn: () => void | Promise<void>) => {
      setVisible(false);
      await new Promise((r) => window.setTimeout(r, durationMs));
      await fn();
    },
    [durationMs],
  );

  const pageStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transition: `opacity ${durationMs}ms ease-in-out`,
  };

  return { fadeNavigate, fadeRun, pageStyle, visible, setVisible };
}
