import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  text: "#1a1a1a",
  dim: "#6b6b6b",
  green: "#16a34a",
  accent: "#C5E831",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type SessionRow = {
  id: string;
  total_score: number | null;
  completed: boolean;
};

export default function AcademicCounselorResults() {
  const navigate = useNavigate();
  const { pageStyle, fadeNavigate } = useFadeNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const debugMode = params.get("debug") === "true";
  const debugScore = parseInt(params.get("score") || "0", 10);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(true);
  const [calcFadeOut, setCalcFadeOut] = useState(false);
  const [session, setSession] = useState<SessionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  // Sequential reveal: score count-up → headline → button
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (debugMode && debugScore > 0) {
        setSession({
          id: "debug-session-" + Date.now(),
          total_score: debugScore,
          completed: true,
        });
        setLoading(false);
        return;
      }
      if (!sessionId) {
        setError("missing");
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from("assessment_sessions_public")
        .select("id, total_score, completed")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      if (err || !data) {
        setError("not_found");
        setLoading(false);
        return;
      }
      setSession(data as SessionRow);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, debugMode, debugScore]);

  // Hold the "Calculating..." screen for ~2.4s after data is ready, then fade.
  useEffect(() => {
    if (loading) return;
    // If error, skip the calculating animation entirely.
    if (error) {
      setCalculating(false);
      return;
    }
    const fadeStart = setTimeout(() => setCalcFadeOut(true), 2100);
    const done = setTimeout(() => setCalculating(false), 2500);
    return () => {
      clearTimeout(fadeStart);
      clearTimeout(done);
    };
  }, [loading, error]);

  // Sequential animation: score count-up → headline → button
  useEffect(() => {
    if (calculating || loading || error || !session) return;
    const finalScore = Math.round(session.total_score ?? 0);
    const qualified = finalScore >= 70;

    const t1 = setTimeout(() => setShowScore(true), 100);

    const duration = 1200;
    const steps = 60;
    let step = 0;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const timer = setInterval(() => {
      step += 1;
      const t = step / steps;
      const value = Math.round(finalScore * easeOut(Math.min(t, 1)));
      setAnimatedScore(value);
      if (step >= steps) {
        setAnimatedScore(finalScore);
        clearInterval(timer);
      }
    }, duration / steps);

    const t2 = setTimeout(() => setShowText(true), 1500);
    const t3 = qualified ? setTimeout(() => setShowButton(true), 2200) : null;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (t3) clearTimeout(t3);
      clearInterval(timer);
    };
  }, [calculating, loading, error, session]);

  const pad = isMobile ? 24 : 48;

  const wrapStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    fontFamily: T.sans,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: pad,
    color: T.text,
    ...pageStyle,
  };

  const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 640,
    textAlign: "center",
  };

  const fadeUp = (visible: boolean, dy = 10): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${dy}px)`,
    transition: `opacity 400ms ease-out, transform 400ms ease-out`,
  });

  const fadeScale = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.95)",
    transition: `opacity 300ms ease-out, transform 300ms ease-out`,
  });

  // ---------- Initial data loading (before calculating screen) ----------
  if (loading) {
    return (
      <div style={wrapStyle}>
        <div style={{ ...innerStyle, color: T.dim, fontSize: 16 }} />
      </div>
    );
  }

  // ---------- Errors ----------
  if (error === "missing" || error === "not_found") {
    return (
      <div style={wrapStyle}>
        <div style={innerStyle}>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, marginBottom: 16 }}>
            Session not found
          </div>
          <div style={{ fontSize: 16, color: T.dim, marginBottom: 32, lineHeight: 1.6 }}>
            Please start the assessment again.
          </div>
          <button
            onClick={() => navigate("/assessment/academic-counselor")}
            style={pillBtn(isMobile)}
          >
            Start Assessment <ArrowRight size={16} color={T.accent} />
          </button>
        </div>
      </div>
    );
  }

  if (!session || session.total_score == null || (!session.completed && session.total_score === 0)) {
    return (
      <div style={wrapStyle}>
        <div style={innerStyle}>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, marginBottom: 16 }}>
            Assessment not completed yet
          </div>
          <div style={{ fontSize: 16, color: T.dim, marginBottom: 32, lineHeight: 1.6 }}>
            Finish all the games to see your results.
          </div>
          <button
            onClick={() => navigate("/assessment/academic-counselor")}
            style={pillBtn(isMobile)}
          >
            Back to assessment <ArrowRight size={16} color={T.accent} />
          </button>
        </div>
      </div>
    );
  }

  // ---------- Calculating overlay ----------
  if (calculating) {
    return (
      <div style={wrapStyle}>
        <style>{`
          @keyframes acr-dot {
            0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-3px); }
          }
          @keyframes acr-fadein {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .acr-calc {
            animation: acr-fadein 300ms ease both;
          }
          .acr-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            margin: 0 3px;
            border-radius: 999px;
            background: #6b6b6b;
            animation: acr-dot 1.2s infinite ease-in-out both;
          }
          .acr-dot:nth-child(2) { animation-delay: 0.15s; }
          .acr-dot:nth-child(3) { animation-delay: 0.3s; }
        `}</style>
        <div
          className="acr-calc"
          style={{
            ...innerStyle,
            opacity: calcFadeOut ? 0 : 1,
            transition: "opacity 300ms ease",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: T.dim,
              marginBottom: 16,
            }}
          >
            Calculating your score
          </div>
          <div aria-hidden>
            <span className="acr-dot" />
            <span className="acr-dot" />
            <span className="acr-dot" />
          </div>
        </div>
      </div>
    );
  }

  // ---------- Score ----------
  const total = session.total_score ?? 0; // out of 100
  const percent = Math.round(total);

  let headline = "";
  let emoji: string | null = null;
  let bodyText: string | null = null;
  let showNextSteps = false;

  if (percent >= 80) {
    headline = "Outstanding! You're in the top tier";
    emoji = "🎉";
    showNextSteps = true;
  } else if (percent >= 70) {
    headline = "Excellent work!";
    emoji = "🌟";
    showNextSteps = true;
  } else if (percent >= 60) {
    headline = "Good effort!";
    bodyText = "Your profile will be reviewed by our team — we'll reach out if there's a match for current openings.";
  } else {
    headline = "Thanks for trying!";
    bodyText = "This role might not be the best fit right now. We encourage you to explore other opportunities and keep building your skills.";
  }

  const headlineSize = isMobile ? 30 : 40;
  const scoreSize = isMobile ? 80 : 112;
  const bodySize = isMobile ? 16 : 17;

  return (
    <div style={wrapStyle}>
      <div style={innerStyle}>
        {/* Phase 1: Big animated score */}
        <div
          style={{
            fontSize: scoreSize,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 32,
            opacity: showScore ? 1 : 0,
            transition: "opacity 300ms ease-out",
          }}
        >
          <span>{animatedScore}</span>
          <span style={{ color: T.dim, fontWeight: 600 }}>/100</span>
        </div>

        {/* Phase 2: Headline + emoji */}
        <div
          style={{
            fontSize: headlineSize,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: bodyText ? 24 : 0,
            ...fadeUp(showText, 10),
          }}
        >
          {headline} {emoji && <span>{emoji}</span>}
        </div>

        {/* Body text (mid/low score, no button) */}
        {bodyText && (
          <div
            style={{
              fontSize: bodySize,
              color: T.dim,
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto",
              whiteSpace: "pre-line",
              ...fadeUp(showText, 10),
            }}
          >
            {bodyText}
          </div>
        )}

        {/* Phase 3: CTA (qualified scores only) */}
        {showNextSteps && (
          <div style={{ marginTop: 40, ...fadeScale(showButton) }}>
            <button
              onClick={() => fadeNavigate(`/assessment/academic-counselor/profile${sessionId ? `?session=${sessionId}` : ""}`)}
              style={pillBtn(isMobile)}
            >
              Complete Your Profile <ArrowRight size={16} color={T.accent} />
            </button>
          </div>
        )}

        {/* Track application status */}
        {sessionId && showText && (
          <div style={{ marginTop: 24, ...fadeUp(showText, 12) }}>
            <a
              href={`/assessment/track/${sessionId}`}
              style={{
                fontSize: 13,
                color: "#6b6b6b",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Track your application status →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function pillBtn(isMobile: boolean): React.CSSProperties {
  return {
    background: "#1a1a1a",
    color: "#ffffff",
    border: "none",
    borderRadius: 999,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
    width: isMobile ? "100%" : "auto",
    justifyContent: "center",
  };
}
