import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAssessmentTelemetry } from "@/hooks/useAssessmentTelemetry";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  white: "#ffffff",
  off: "#f7f6f3",
  green: "#C5E831",
  greenTint: "#f4fadc",
  border: "#e8e3d8",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaaaaa",
  red: "#dc2626",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type Phase = "context" | "course" | "questions" | "scoring";

const QUESTIONS = [
  {
    q: "The course includes how many live doubt-clearing sessions per month?",
    options: ["4 sessions", "8 sessions", "12 sessions", "16 sessions"],
    correct: 1,
  },
  {
    q: "A parent asks if their 7th grade child who's weak in math can join this program - based on what you saw, what would you tell them?",
    options: [
      "Yes, the program covers Class 7",
      "No, this program is only for Class 11-12",
      "Yes, but they should start with the foundation batch first",
      "No, the child needs to be in Class 10 minimum",
    ],
    correct: 1,
  },
  {
    q: "If a student enrolls on January 15th, when does their first live class happen according to the schedule?",
    options: [
      "Same day (January 15th)",
      "Next Monday",
      "Within 3 days",
      "After the batch start date mentioned in the brochure",
    ],
    correct: 3,
  },
  {
    q: "The course costs ₹48,000 total and the parent wants to pay over 8 months with zero down payment - what's the monthly EMI amount they'll pay?",
    options: ["₹5,000/month", "₹6,000/month", "₹7,000/month", "₹8,000/month"],
    correct: 1,
  },
  {
    q: "A parent enrolled 2 weeks ago but now wants to switch from the 6-month plan to the 12-month plan - based on the policy you saw, is this allowed and if yes, within how many days of enrollment?",
    options: [
      "Yes, within 7 days",
      "Yes, within 15 days",
      "Yes, anytime during the course",
      "No, plan changes not allowed after enrollment",
    ],
    correct: 1,
  },
];

// Column 1: Program Details
const COL1_DETAILS = [
  ["Program", "NEET Foundation Course"],
  ["Target", "Class 11-12 (CBSE/State/ICSE)"],
  ["Duration", "18 months (July 2025 - Dec 2026)"],
  ["Batch Size", "Max 30 students per batch"],
  ["Batch Start", "July 15, 2025 (first live class)"],
  ["Timings", "Evening (7:00 PM - 9:00 PM)"],
];

// Column 2: Class Structure
const COL2_STRUCTURE = [
  ["Live Classes", "5 per week (Mon-Fri)"],
  ["Doubt Sessions", "8 live sessions per month"],
  ["Recorded Lectures", "200+ hours on-demand"],
  ["Study Material", "NCERT + 500 practice Qs"],
  ["Mock Exams", "Monthly full-length tests"],
  ["Teachers", "IIT/AIIMS alumni (5+ yrs exp)"],
];

const COL2_FEATURES = [
  "Personal mentorship included",
  "Weekly progress reports to parents",
  "24-hour doubt resolution guarantee",
  "Mobile app (iOS & Android)",
  "Previous year Qs (2015-2024)",
];

// Column 3: Pricing & Policy
const COL3_PRICING = [
  ["Price", "₹48,000 for full program"],
  ["EMI", "₹6,000/month × 8 (0% interest)"],
  ["Early Bird", "₹5,000 off before June 30"],
  ["Sibling", "10% off for 2nd child"],
];

const COL3_POLICY = [
  ["Refund", "7 days full refund, no questions"],
  ["Plan Switch", "Allowed within 15 days of enrollment"],
  ["Cancellation", "Can pause up to 3 months"],
];

function pillButton(label: string, onClick: () => void, disabled = false) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        background: T.text,
        color: "#fff",
        border: "none",
        borderRadius: 99,
        paddingLeft: 24,
        paddingRight: 8,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 16,
        fontWeight: 500,
        fontFamily: T.sans,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {label}
      <span
        style={{
          width: 32,
          height: 32,
          background: T.green,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ArrowRight size={16} color={T.text} strokeWidth={2.5} />
      </span>
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: T.green,
        }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: T.dim,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 4, flexShrink: 0 }}>
      <circle cx="7" cy="7" r="7" fill={T.green} />
      <path d="M4 7L6 9L10 5" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AcademicCounselorGame2() {
  const { fadeNavigate } = useFadeNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";

  useAssessmentTelemetry(sessionId, "game-2");

  const [phase, setPhase] = useState<Phase>("context");
  const [fade, setFade] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fade in on phase change
  useEffect(() => {
    setFade(false);
    const t = setTimeout(() => setFade(true), 20);
    return () => clearTimeout(t);
  }, [phase]);

  // Timer for course display
  useEffect(() => {
    if (phase !== "course") return;
    if (timeLeft <= 0) {
      const t = setTimeout(() => transitionTo("questions"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const transitionTo = (next: Phase) => {
    setFade(false);
    setTimeout(() => setPhase(next), 300);
  };

  const selectOption = (idx: number) => {
    const next = [...answers];
    next[qIndex] = idx;
    setAnswers(next);
  };

  const handleContinue = async () => {
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex((i) => i + 1);
      return;
    }
    // Submit
    transitionTo("scoring");

    const correctCount = answers.reduce((acc, a, i) => acc + (a === QUESTIONS[i].correct ? 1 : 0), 0);
    const calculatedScore = (correctCount / QUESTIONS.length) * 25;

    try {
      if (sessionId) {
        const { data: row } = await supabase
          .from("assessment_sessions_public")
          .select("scores")
          .eq("id", sessionId)
          .maybeSingle();
        const prev = (row?.scores as Record<string, unknown>) ?? {};
        const merged = {
          ...prev,
          game2: {
            correct_answers: correctCount,
            total_questions: QUESTIONS.length,
            answers,
            time_viewed: 15,
            total_score: calculatedScore,
            timestamp: new Date().toISOString(),
          },
        };
        await supabase
          .from("assessment_sessions")
          .update({
            scores: merged,
            current_step: "game-3",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
      }
    } catch (err) {
      toast({ title: "Couldn't save", description: "Moving on anyway.", variant: "destructive" });
    }

    setTimeout(() => {
      fadeNavigate(`/assessment/academic-counselor/game-3${sessionId ? `?session=${sessionId}${roleQs}` : ""}`);
    }, 1700);
  };

  const fadeStyle: React.CSSProperties = {
    opacity: fade ? 1 : 0,
    transition: "opacity 300ms ease",
  };

  // ============ CONTEXT ============
  if (phase === "context") {
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
          padding: isMobile ? 24 : 48,
          ...fadeStyle,
        }}
      >
        <div style={{ maxWidth: 600, width: "100%" }}>
          <h1
            style={{
              fontSize: isMobile ? 32 : 48,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 24,
              color: "#1a1a1a",
              textAlign: "left",
            }}
          >
            Say It Like You See It
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#6b6b6b", marginBottom: 32, textAlign: "left" }}>
            You’ll have 10 seconds to study an academic course program, then answer 5 memory-based questions - including
            a pricing calculation.
          </p>
          {pillButton("Got it, start", () => {
            setTimeLeft(10);
            transitionTo("course");
          })}
        </div>
      </div>
    );
  }

  // ============ COURSE DISPLAY ============
  if (phase === "course") {
    const isUrgent = timeLeft < 5;
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
          padding: isMobile ? 16 : 24,
          ...fadeStyle,
        }}
      >
        <div style={{ maxWidth: 900, width: "100%" }}>
          {/* Prominent Timer */}
          <div
            style={{
              display: "flex",
              justifyContent: isMobile ? "center" : "flex-end",
              marginBottom: 24,
            }}
          >
            <div
              className="g2-timer"
              style={{
                background: isUrgent ? T.red : "rgba(26,26,26,0.9)",
                color: isUrgent ? "#fff" : T.green,
                fontSize: 32,
                fontWeight: 700,
                fontFamily: T.sans,
                padding: "12px 24px",
                borderRadius: 99,
                animation: isUrgent ? "pulse 0.8s ease-in-out infinite" : "none",
                transition: "background 300ms ease, color 300ms ease",
              }}
            >
              {timeLeft}
            </div>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}</style>

          {/* Course Card - Polished Horizontal 3-Column Layout */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              borderLeft: `4px solid ${T.green}`,
              padding: isMobile ? 24 : 32,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              maxWidth: 920,
            }}
          >
            {/* Header */}
            <h2
              style={{
                fontSize: isMobile ? 22 : 28,
                fontWeight: 700,
                color: T.text,
                marginBottom: 12,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              NEET Foundation Batch 2027
            </h2>
            <p
              style={{
                fontSize: 15,
                fontWeight: 400,
                color: T.dim,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Comprehensive 2-year program for medical aspirants
            </p>
            <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: 24 }} />

            {/* 3-Column Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: isMobile ? 20 : 32,
              }}
            >
              {/* ===== COLUMN 1: Program Details ===== */}
              <div>
                <SectionHeader label="Program Details" />
                <div
                  style={{
                    background: "#fafafa",
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {COL1_DETAILS.map(([label, val]) => (
                    <div key={label} style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 600, color: T.text }}>{label}:</span>{" "}
                      <span style={{ color: T.dim }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== COLUMN 2: Class Structure ===== */}
              <div>
                <SectionHeader label="Class Structure" />
                <ul
                  style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {COL2_STRUCTURE.map(([label, val]) => (
                    <li
                      key={label}
                      style={{
                        fontSize: 13,
                        lineHeight: 1.8,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: T.green,
                          marginTop: 9,
                          flexShrink: 0,
                        }}
                      />
                      <span>
                        <span style={{ fontWeight: 600, color: T.text }}>{label}:</span>{" "}
                        <span style={{ color: T.dim }}>{val}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div style={{ borderTop: `1px solid ${T.border}`, margin: "12px 0" }} />

                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Features</div>
                <ul
                  style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {COL2_FEATURES.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: 13,
                        lineHeight: 1.8,
                        color: T.dim,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: T.green,
                          marginTop: 9,
                          flexShrink: 0,
                        }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ===== COLUMN 3: Pricing & Policy ===== */}
              <div>
                <SectionHeader label="Pricing" />
                <div
                  style={{
                    background: T.off,
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
                      ₹48,000
                    </div>
                    <div style={{ fontSize: 13, color: T.dim, marginTop: 2 }}>for full program</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>
                      ₹6,000/month × 8
                    </div>
                    <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>EMI (0% interest)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.green, lineHeight: 1.2 }}>₹5,000 off</div>
                    <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Early Bird - before June 30</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.green, lineHeight: 1.2 }}>10% off</div>
                    <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Sibling - for 2nd child</div>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${T.border}`, margin: "12px 0" }} />

                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Policy</div>
                <ul
                  style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {COL3_POLICY.map(([label, val]) => (
                    <li
                      key={label}
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <Check />
                      <span>
                        <span style={{ fontWeight: 600, color: T.text }}>{label}:</span>{" "}
                        <span style={{ color: T.dim }}>{val}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ SCORING ============
  if (phase === "scoring") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.white,
          fontFamily: T.sans,
          color: T.dim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 500,
          ...fadeStyle,
        }}
      >
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }`}</style>
        <span style={{ animation: "pulse 1.4s ease-in-out infinite" }}>Scoring your answers…</span>
      </div>
    );
  }

  // ============ QUESTIONS ============
  const currentQ = QUESTIONS[qIndex];
  const selected = answers[qIndex];
  const isLast = qIndex === QUESTIONS.length - 1;

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
        padding: isMobile ? 24 : 32,
        ...fadeStyle,
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .g2-option { padding: 14px 16px !important; font-size: 15px !important; }
          .g2-question-text { font-size: 20px !important; }
          .g2-timer { font-size: 14px !important; top: 12px !important; right: 16px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 640, width: "100%" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: T.dim,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Question {qIndex + 1} of {QUESTIONS.length}
        </div>

        <h2
          className="g2-question-text"
          style={{
            fontSize: isMobile ? 18 : 20,
            fontWeight: 600,
            color: T.text,
            marginBottom: 16,
            lineHeight: 1.4,
          }}
        >
          {currentQ.q}
        </h2>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selected === idx;
            return (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                className="g2-option"
                style={{
                  textAlign: "left",
                  background: isSelected ? T.greenTint : T.white,
                  border: `2px solid ${isSelected ? T.green : T.border}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  fontSize: 16,
                  fontFamily: T.sans,
                  color: T.text,
                  cursor: "pointer",
                  transition: "border-color 150ms ease, background 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = T.green;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div style={{ marginTop: 24 }}>{pillButton(isLast ? "Submit" : "Continue", handleContinue)}</div>
        )}
      </div>
    </div>
  );
}
