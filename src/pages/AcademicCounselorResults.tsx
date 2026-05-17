import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
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
  name: string | null;
  email: string | null;
};

export default function AcademicCounselorResults() {
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const debugMode = params.get("debug") === "true";

  const [session, setSession] = useState<SessionRow | null>(null);
  const [scored, setScored] = useState(false);
  const [scoredTotal, setScoredTotal] = useState(0);

  useEffect(() => {
    if (debugMode || (IS_STAGING && !sessionId)) {
      setSession({ id: "demo", name: "Demo Candidate", email: "you@youremail.com" });
      return;
    }
    if (!sessionId) return;
    supabase
      .from("assessment_sessions_public")
      .select("id, name, email")
      .eq("id", sessionId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSession(data as SessionRow);
      });
  }, [sessionId, debugMode]);

  useEffect(() => {
    if (!sessionId || IS_STAGING) return;
    const channel = supabase
      .channel(`results-live:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "assessment_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as any;
          if (row.total_score > 0 && row.scores?.review) {
            setScoredTotal(Math.round(row.total_score));
            setScored(true);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const email = session?.email;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.white,
        fontFamily: T.sans,
        color: T.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <style>{`
        @keyframes acr-fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          animation: "acr-fadeup 360ms ease both",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: T.green,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <MailCheck size={36} color={T.text} strokeWidth={2} />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "clamp(24px, 7vw, 34px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            margin: "0 0 16px",
            color: T.text,
          }}
        >
          We've got your answers!
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: "clamp(15px, 4vw, 17px)",
            lineHeight: 1.65,
            color: T.dim,
            margin: "0 0 24px",
          }}
        >
          We're reviewing your responses and will get back to you within 60 minutes.
          We'll send an update to{" "}
          {email ? (
            <strong style={{ color: T.text }}>{email}</strong>
          ) : (
            "your email"
          )}
          .
        </p>

        {/* Smaller note */}
        <p
          style={{
            fontSize: 14,
            color: T.dim,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          You can close this tab - we'll email you when your results are ready.
        </p>

        {scored && (
          <div style={{
            marginTop: 32,
            padding: "24px",
            background: scoredTotal >= 70 ? "#f0fdf4" : "#f9fafb",
            border: `1px solid ${scoredTotal >= 70 ? "#bbf7d0" : "#e5e5e5"}`,
            borderRadius: 16,
            textAlign: "center",
            animation: "acr-fadeup 360ms ease both",
          }}>
            <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8, color: "#1a1a1a" }}>
              {scoredTotal}<span style={{ fontSize: 24, color: "#6b6b6b", fontWeight: 600 }}>/100</span>
            </div>
            {scoredTotal >= 70 ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", marginBottom: 16 }}>You passed!</div>
                <a
                  href={`/assessment/academic-counselor/profile?session=${sessionId}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: "#1a1a1a", color: "#fff", textDecoration: "none",
                    borderRadius: 99, paddingLeft: 20, paddingRight: 8,
                    paddingTop: 12, paddingBottom: 12,
                    fontSize: 14, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
                  }}
                >
                  Complete your profile
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", background: "#C5E831",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}>{"→"}</span>
                </a>
              </>
            ) : (
              <div style={{ fontSize: 15, color: "#6b6b6b", lineHeight: 1.6 }}>
                Thank you for taking the assessment. We'll be in touch if anything changes.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
