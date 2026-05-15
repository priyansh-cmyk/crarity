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

  useEffect(() => {
    if (debugMode || IS_STAGING) {
      setSession({ id: "demo", name: "Demo Candidate", email: "demo@example.com" });
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
        padding: "32px 24px",
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
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: T.green,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <MailCheck size={36} color={T.text} strokeWidth={2} />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 32,
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
            fontSize: 17,
            lineHeight: 1.6,
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
      </div>
    </div>
  );
}
