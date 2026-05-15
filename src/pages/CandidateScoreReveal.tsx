import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const IS_STAGING =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("staging") || window.location.hostname.includes("localhost"));

const T = {
  white: "#ffffff",
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type SessionRow = {
  id: string;
  total_score: number | null;
  scores: Record<string, unknown> | null;
};

type UIState = "loading" | "not_ready" | "revealed";

export default function CandidateScoreReveal() {
  const [params] = useSearchParams();
  const sessionId = params.get("session");

  const [uiState, setUiState] = useState<UIState>("loading");
  const [session, setSession] = useState<SessionRow | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    async function load() {
      // On staging/localhost, show a mock score so the page is visible
      if (IS_STAGING && !sessionId) {
        const mock: SessionRow = {
          id: "staging-mock",
          total_score: 82,
          scores: { review: { status: "reviewed" } },
        };
        setSession(mock);
        setUiState("revealed");
        return;
      }

      if (!sessionId) {
        setUiState("not_ready");
        return;
      }

      const { data, error } = await supabase
        .from("assessment_sessions_public")
        .select("id, total_score, scores")
        .eq("id", sessionId)
        .maybeSingle();

      if (error || !data) {
        setUiState("not_ready");
        return;
      }

      const row = data as SessionRow;
      const hasReview = !!(row.scores as any)?.review;
      const totalScore = row.total_score ?? 0;

      if (totalScore > 0 && hasReview) {
        setSession(row);
        setUiState("revealed");
      } else {
        setSession(row);
        setUiState("not_ready");
      }
    }
    load();
  }, [sessionId]);

  // Score count-up animation
  useEffect(() => {
    if (uiState !== "revealed" || !session) return;
    const finalScore = Math.round(session.total_score ?? 0);

    const t1 = setTimeout(() => setShowScore(true), 200);

    const duration = 1200;
    const steps = 60;
    let step = 0;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const timer = setInterval(() => {
      step += 1;
      const t = step / steps;
      setAnimatedScore(Math.round(finalScore * easeOut(Math.min(t, 1))));
      if (step >= steps) {
        setAnimatedScore(finalScore);
        clearInterval(timer);
      }
    }, duration / steps);

    const t2 = setTimeout(() => setShowText(true), 1500);
    const qualified = finalScore >= 70;
    const t3 = qualified ? setTimeout(() => setShowButton(true), 2200) : null;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (t3) clearTimeout(t3);
      clearInterval(timer);
    };
  }, [uiState, session]);

  const wrapStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: T.white,
    fontFamily: T.sans,
    color: T.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 600,
    width: "100%",
    textAlign: "center",
  };

  const fadeUp = (visible: boolean, dy = 10): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${dy}px)`,
    transition: "opacity 400ms ease-out, transform 400ms ease-out",
  });

  const fadeScale = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.95)",
    transition: "opacity 300ms ease-out, transform 300ms ease-out",
  });

  if (uiState === "loading") {
    return (
      <div style={wrapStyle}>
        <style>{`
          @keyframes csr-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid #e5e5e5`,
            borderTopColor: T.text,
            borderRadius: "50%",
            animation: "csr-spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (uiState === "not_ready") {
    return (
      <div style={wrapStyle}>
        <div style={innerStyle}>
          <div style={{ fontSize: 36, marginBottom: 20 }}>
            <span style={{ display: "inline-block", fontSize: 48 }}>&#8987;</span>
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
            }}
          >
            Your results are still being finalized
          </h1>
          <p
            style={{
              fontSize: 16,
              color: T.dim,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Check back soon or wait for our email - we'll send you a link when your results are ready.
          </p>
        </div>
      </div>
    );
  }

  // revealed
  const finalScore = Math.round(session?.total_score ?? 0);
  const qualified = finalScore >= 70;

  return (
    <div style={wrapStyle}>
      <style>{`
        @keyframes csr-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ ...innerStyle, animation: "csr-fadein 320ms ease both" }}>
        {/* Score */}
        <div
          style={{
            fontSize: "clamp(72px, 16vw, 112px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 28,
            opacity: showScore ? 1 : 0,
            transition: "opacity 300ms ease-out",
          }}
        >
          <span>{animatedScore}</span>
          <span style={{ color: T.dim, fontWeight: 600, fontSize: "0.55em" }}>/100</span>
        </div>

        {qualified ? (
          <>
            {/* "You passed" chip */}
            <div style={{ ...fadeUp(showText) }}>
              <span
                style={{
                  display: "inline-block",
                  background: T.green,
                  color: T.text,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  padding: "5px 14px",
                  borderRadius: 999,
                  marginBottom: 20,
                }}
              >
                You passed
              </span>
            </div>

            {/* Heading + subtext */}
            <div style={{ ...fadeUp(showText), transitionDelay: "60ms" }}>
              <div
                style={{
                  fontSize: "clamp(22px, 5vw, 30px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: 10,
                  color: T.text,
                }}
              >
                Congratulations!
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: T.dim,
                  lineHeight: 1.6,
                  maxWidth: 360,
                  margin: "0 auto 32px",
                }}
              >
                You passed - complete your profile to get discovered by employers on Crarity.
              </div>
            </div>

            {/* CTA */}
            <div style={{ ...fadeScale(showButton) }}>
              <a
                href={`/assessment/academic-counselor/profile?session=${sessionId ?? ""}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: T.text,
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 999,
                  paddingLeft: 24,
                  paddingRight: 8,
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: T.sans,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
                }}
              >
                Complete your profile
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: T.green,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 16,
                  }}
                >
                  →
                </span>
              </a>
            </div>
          </>
        ) : (
          <div style={{ ...fadeUp(showText) }}>
            <div
              style={{
                fontSize: "clamp(20px, 4vw, 26px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: 12,
              }}
            >
              Thanks for taking the assessment
            </div>
            <div
              style={{
                fontSize: 16,
                color: T.dim,
                lineHeight: 1.6,
                maxWidth: 380,
                margin: "0 auto",
              }}
            >
              We'll review your results and reach out if there's a match. Keep an eye on your inbox.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
