import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, Circle } from "lucide-react";

const T = {
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  bg: "#f7f6f3",
  green: "#C5E831",
};

type StepState = "done" | "active" | "pending";

interface StepInfo {
  key: string;
  label: string;
  description: string;
}

const STEPS: StepInfo[] = [
  {
    key: "submitted",
    label: "Assessment Submitted",
    description: "Your answers have been received.",
  },
  {
    key: "ai_scoring",
    label: "AI Scoring in Progress",
    description: "Our AI is evaluating your responses. This usually takes 1-2 minutes.",
  },
  {
    key: "admin_review",
    label: "Under Review",
    description: "A Crarity team member is reviewing your results.",
  },
  {
    key: "approved",
    label: "Sent to Employers",
    description: "Your profile has been approved and shared with matched employers.",
  },
];

interface SessionInfo {
  completed: boolean;
  total_score: number | null;
  admin_approved: boolean;
  scores: Record<string, unknown> | null;
  status: string | null;
  name: string | null;
}

function deriveStepIndex(session: SessionInfo): number {
  // Step 3: approved
  if (session.admin_approved) return 3;
  // Step 2: admin reviewed (review.status === "reviewed") but not yet approved
  const reviewStatus = (session.scores as any)?.review?.status;
  if (reviewStatus === "reviewed") return 2;
  // Step 1: AI scoring complete (total_score set) — still waiting for admin
  if (typeof session.total_score === "number" && session.total_score > 0) return 2;
  // Step 0: submitted, AI scoring queued/in-progress
  if (session.completed) return 1;
  return 0;
}

function stepState(stepIndex: number, currentIndex: number): StepState {
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export default function AssessmentTrack() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) { setNotFound(true); setLoading(false); return; }
    loadSession();
    // Poll every 30s to catch AI scoring completing
    const interval = setInterval(loadSession, 30_000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSession = async () => {
    const { data, error } = await supabase
      .from("assessment_sessions_public")
      .select("completed, total_score, admin_approved, scores, status")
      .eq("id", sessionId!)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setSession(data as unknown as SessionInfo);
    setLoading(false);
  };

  if (loading) {
    return (
      <Shell>
        <div style={{ color: T.dim, fontSize: 15 }}>Loading your status…</div>
      </Shell>
    );
  }

  if (notFound || !session) {
    return (
      <Shell>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
            Session not found
          </h2>
          <p style={{ fontSize: 14, color: T.dim, margin: "0 0 24px" }}>
            Double-check your link, or return to the assessment page.
          </p>
          <Link
            to="/assessment/academic-counselor"
            style={{
              background: T.text,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 99,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Back to assessment
          </Link>
        </div>
      </Shell>
    );
  }

  if (!session.completed) {
    return (
      <Shell>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
            Assessment in progress
          </h2>
          <p style={{ fontSize: 14, color: T.dim, margin: 0 }}>
            Your session hasn't been submitted yet. Please complete it first.
          </p>
        </div>
      </Shell>
    );
  }

  const currentIndex = deriveStepIndex(session);

  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
          Application Status
        </h1>
        <p style={{ fontSize: 15, color: T.dim, margin: 0 }}>
          Here's where your application stands right now.
        </p>
      </div>

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STEPS.map((step, i) => {
          const state = stepState(i, currentIndex);
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.key} style={{ display: "flex", gap: 16, position: "relative" }}>
              {/* Icon + line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <StepIcon state={state} />
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 32,
                      background: state === "done" ? T.text : T.border,
                      margin: "4px 0",
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : 24, paddingTop: 2 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: state === "pending" ? 500 : 600,
                    color: state === "pending" ? T.dim : T.text,
                    marginBottom: 4,
                  }}
                >
                  {step.label}
                  {state === "active" && (
                    <span
                      style={{
                        marginLeft: 8,
                        background: T.green,
                        color: T.text,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        verticalAlign: "middle",
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.5 }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approved CTA */}
      {currentIndex === 3 && (
        <div
          style={{
            marginTop: 36,
            background: T.green,
            borderRadius: 14,
            padding: "20px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            You've been approved!
          </div>
          <div style={{ fontSize: 13, color: T.text, marginBottom: 16 }}>
            Employers can now view your profile and schedule interviews.
          </div>
          <Link
            to="/candidate/dashboard"
            style={{
              background: T.text,
              color: "#fff",
              padding: "10px 22px",
              borderRadius: 99,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Go to dashboard →
          </Link>
        </div>
      )}

      <p style={{ fontSize: 12, color: T.dim, textAlign: "center", marginTop: 32 }}>
        This page refreshes automatically every 30 seconds.
      </p>
    </Shell>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: T.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CheckCircle2 size={16} color="#fff" />
      </div>
    );
  if (state === "active")
    return (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: T.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `2px solid ${T.text}`,
        }}
      >
        <Clock size={14} color={T.text} />
      </div>
    );
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#fff",
        border: `2px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Circle size={10} color={T.border} />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: T.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: T.green,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Crarity</span>
        </div>
        {children}
      </div>
    </div>
  );
}
