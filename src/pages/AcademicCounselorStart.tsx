import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  white: "#ffffff",
  green: "#C5E831",
  border: "#e8e3d8",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaaaaa",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type FormData = {
  name: string;
  phone: string;
  email: string;
  city: string;
};

type RelocationTimeline = "immediate" | "15_days" | "1_month" | "2_months";

const QUESTIONS = [
  { key: "name" as const, label: "What's your name?", placeholder: "Full name", type: "text", inputMode: "text" as const },
  { key: "phone" as const, label: "Phone number?", placeholder: "10-digit mobile number", type: "tel", inputMode: "numeric" as const },
  { key: "email" as const, label: "Email address?", placeholder: "your@email.com", type: "email", inputMode: "email" as const },
  { key: "city" as const, label: "Which city are you from?", placeholder: "City name", type: "text", inputMode: "text" as const },
];

const BANGALORE_ALIASES = ["bangalore", "bengaluru", "blr"];
function isBangalore(city: string): boolean {
  return BANGALORE_ALIASES.includes(city.trim().toLowerCase());
}

const TIMELINE_OPTIONS: { value: RelocationTimeline; label: string }[] = [
  { value: "immediate", label: "Immediately" },
  { value: "15_days", label: "Within 15 days" },
  { value: "1_month", label: "Within 1 month" },
  { value: "2_months", label: "Within 2 months" },
];

function validate(key: keyof FormData, value: string): boolean {
  const v = value.trim();
  if (key === "name") return v.length >= 3;
  if (key === "phone") {
    const digits = v.replace(/\s/g, "");
    return /^[6-9]\d{9}$/.test(digits);
  }
  if (key === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (key === "city") return true;
  return false;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AcademicCounselorStart() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const [searchParams] = useSearchParams();
  const roleIdParam = searchParams.get("role_id");
  const roleId = roleIdParam && UUID_RE.test(roleIdParam) ? roleIdParam : null;
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<FormData>({ name: "", phone: "", email: "", city: "" });
  const [focused, setFocused] = useState(false);
  const [onRelocationStep, setOnRelocationStep] = useState(false);
  const [willingToRelocate, setWillingToRelocate] = useState<boolean | null>(null);
  const [relocationTimeline, setRelocationTimeline] = useState<RelocationTimeline | null>(null);
  const [resumeSession, setResumeSession] = useState<{ id: string; current_step: string } | null>(null);
  // Holds the ID of the partial session created at the email step
  const [partialSessionId, setPartialSessionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Step URL map for resume navigation
  const STEP_URLS: Record<string, string> = {
    "game-1": "/assessment/academic-counselor/game-1",
    "game-2": "/assessment/academic-counselor/game-2",
    "game-3": "/assessment/academic-counselor/game-3",
    "game-4": "/assessment/academic-counselor/game-4",
    "filter-1": "/assessment/academic-counselor/filter-1",
    "filter-2": "/assessment/academic-counselor/filter-2",
    "filter-3": "/assessment/academic-counselor/filter-3",
    "results": "/assessment/academic-counselor/results",
  };
  const STEP_LABELS: Record<string, string> = {
    "game-1": "Game 1 - Pick Your Shot",
    "game-2": "Game 2 - Say It Like You Mean It",
    "game-3": "Game 3 - Beyond The Student",
    "game-4": "Game 4 - Handle the Heat",
    "filter-1": "Questions - Part 1",
    "filter-2": "Questions - Part 2",
    "filter-3": "Questions - Part 3",
    "results": "Results",
  };

  const q = QUESTIONS[step];
  const value = data[q.key];
  const isValid = validate(q.key, value);
  const isLastQuestion = step === QUESTIONS.length - 1;
  const cityIsBangalore = isBangalore(data.city);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setVisible(true);
      if (!onRelocationStep) inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [step, onRelocationStep]);

  const submitSession = async () => {
    setSubmitting(true);
    try {
      const cityTrimmed = data.city.trim();
      const bangalore = isBangalore(cityTrimmed);
      const roleQs = roleId ? `&role_id=${roleId}` : "";

      if (partialSessionId) {
        // Partial session already created at email step — just fill in the rest
        const { error } = await supabase
          .from("assessment_sessions")
          .update({
            city: cityTrimmed,
            current_step: "game-1",
            willing_to_relocate: bangalore ? true : willingToRelocate,
            relocation_timeline: bangalore ? null : relocationTimeline,
          })
          .eq("id", partialSessionId);
        if (error) throw error;
        fadeNavigate(`/assessment/academic-counselor/game-1?session=${partialSessionId}${roleQs}`);
      } else {
        // Fallback: create fresh (shouldn't happen in normal flow)
        const { data: inserted, error } = await supabase
          .from("assessment_sessions")
          .insert({
            name: data.name.trim(),
            phone: data.phone.replace(/\s/g, ""),
            email: data.email.trim().toLowerCase(),
            city: cityTrimmed,
            current_step: "game-1",
            role_id: roleId,
            willing_to_relocate: bangalore ? true : willingToRelocate,
            relocation_timeline: bangalore ? null : relocationTimeline,
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (!inserted?.id) throw new Error("Session was not created");
        fadeNavigate(`/assessment/academic-counselor/game-1?session=${inserted.id}${roleQs}`);
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    if (submitting) return;

    if (onRelocationStep) {
      // Only proceed if "Yes" + timeline picked
      if (willingToRelocate === true && relocationTimeline) {
        await submitSession();
      }
      return;
    }

    if (!isValid) return;

    if (!isLastQuestion) {
      // After the email step (step 2): check for existing session + create partial record
      if (step === 2) {
        const email = data.email.trim().toLowerCase();
        const { data: existing } = await supabase
          .from("assessment_sessions")
          .select("id, current_step")
          .eq("email", email)
          .eq("completed", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          if (STEP_URLS[existing.current_step as string]) {
            // Has a real game step — show resume modal
            setResumeSession(existing as { id: string; current_step: string });
            return;
          } else {
            // Partial intake session from a previous visit — reuse it silently
            setPartialSessionId(existing.id);
            await supabase.from("assessment_sessions")
              .update({ name: data.name.trim(), phone: data.phone.replace(/\s/g, ""), email })
              .eq("id", existing.id);
          }
        } else {
          // No prior session — create partial record now so admin can see them
          const { data: inserted } = await supabase
            .from("assessment_sessions")
            .insert({
              name: data.name.trim(),
              phone: data.phone.replace(/\s/g, ""),
              email,
              current_step: "intake",
              role_id: roleId,
            })
            .select("id")
            .maybeSingle();
          if (inserted?.id) setPartialSessionId(inserted.id);
          // Best-effort — don't block the user if insert fails
        }
      }
      setVisible(false);
      setTimeout(() => setStep((s) => s + 1), 200);
      return;
    }

    // Last question (city). If Bangalore → submit, else → relocation step.
    if (cityIsBangalore) {
      await submitSession();
    } else {
      setVisible(false);
      setTimeout(() => setOnRelocationStep(true), 200);
    }
  };

  const goBack = () => {
    if (onRelocationStep) {
      setWillingToRelocate(null);
      setRelocationTimeline(null);
      setVisible(false);
      setTimeout(() => setOnRelocationStep(false), 200);
      return;
    }
    if (step === 0) {
      fadeNavigate("/assessment/academic-counselor");
      return;
    }
    setVisible(false);
    setTimeout(() => setStep((s) => s - 1), 200);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (q.key === "phone") v = formatPhone(v);
    setData((d) => ({ ...d, [q.key]: v }));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValid) {
      e.preventDefault();
      goNext();
    }
  };

  // Resume modal
  if (resumeSession) {
    const stepLabel = STEP_LABELS[resumeSession.current_step] ?? resumeSession.current_step;
    const resumeUrl = STEP_URLS[resumeSession.current_step];
    const roleQs = roleId ? `&role_id=${roleId}` : "";
    return (
      <div style={{
        minHeight: "100vh", background: "#f7f6f3", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: T.sans, padding: 24,
      }}>
        <div style={{
          background: "#fff", border: "1px solid #e5e5e5", borderRadius: 20,
          padding: "48px 40px", maxWidth: 480, width: "100%",
        }}>
          <div style={{ fontSize: 28, marginBottom: 16 }}>👋</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 12px" }}>
            Welcome back!
          </h2>
          <p style={{ fontSize: 15, color: T.dim, lineHeight: 1.6, margin: "0 0 32px" }}>
            You have an incomplete assessment. Resume from where you left off?
          </p>
          <div style={{
            background: "#f7f6f3", borderRadius: 12, padding: "16px 20px",
            marginBottom: 28, display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 20 }}>📍</div>
            <div>
              <div style={{ fontSize: 12, color: T.dim, marginBottom: 2 }}>Last reached</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{stepLabel}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => fadeNavigate(`${resumeUrl}?session=${resumeSession.id}${roleQs}`)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: T.text, color: "#fff", border: "none",
                padding: "14px 20px", borderRadius: 99, fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: T.sans,
              }}
            >
              Resume assessment
              <span style={{
                width: 32, height: 32, borderRadius: "50%", background: T.green,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>→</span>
            </button>
            <button
              onClick={() => setResumeSession(null)}
              style={{
                background: "#fff", color: T.text, border: `1px solid #e5e5e5`,
                padding: "14px 20px", borderRadius: 99, fontSize: 15, fontWeight: 500,
                cursor: "pointer", fontFamily: T.sans,
              }}
            >
              Start fresh instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.white,
        fontFamily: T.sans,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        ...pageStyle,
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
        }}
      >
        <button
          onClick={goBack}
          aria-label="Go back"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.text,
            borderRadius: 8,
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.dim, letterSpacing: "0.04em" }}>
          {onRelocationStep ? QUESTIONS.length + 1 : step + 1} of {QUESTIONS.length + (onRelocationStep ? 1 : 0)}
        </span>
      </header>

      {/* Question */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
        >
          {onRelocationStep ? (
            <RelocationStep
              city={data.city.trim()}
              willing={willingToRelocate}
              setWilling={setWillingToRelocate}
              timeline={relocationTimeline}
              setTimeline={setRelocationTimeline}
              onContinue={goNext}
              submitting={submitting}
            />
          ) : (
            <>
              <h1
                style={{
                  fontSize: "clamp(22px, 4vw, 28px)",
                  fontWeight: 600,
                  color: T.text,
                  letterSpacing: "-0.01em",
                  marginBottom: 24,
                  lineHeight: 1.2,
                }}
              >
                {q.label}
              </h1>

              <input
                ref={inputRef}
                type={q.type}
                inputMode={q.inputMode}
                placeholder={q.placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={
                  q.key === "name" ? "name" : q.key === "phone" ? "tel" : q.key === "email" ? "email" : "address-level2"
                }
                style={{
                  width: "100%",
                  height: 56,
                  fontSize: 18,
                  fontFamily: T.sans,
                  color: T.text,
                  padding: "0 16px",
                  border: `1.5px solid ${focused ? T.green : T.border}`,
                  borderRadius: 10,
                  outline: "none",
                  background: T.white,
                  transition: "border-color 150ms ease",
                  boxSizing: "border-box",
                }}
              />

              {/* Continue button */}
              <div
                style={{
                  marginTop: 24,
                  opacity: isValid ? 1 : 0,
                  transform: isValid ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 200ms ease, transform 200ms ease",
                  pointerEvents: isValid ? "auto" : "none",
                }}
              >
                <button
                  onClick={goNext}
                  disabled={!isValid || submitting}
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
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: T.sans,
                    cursor: submitting ? "wait" : "pointer",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {isLastQuestion
                    ? cityIsBangalore
                      ? submitting
                        ? "Starting…"
                        : "Start"
                      : "Continue"
                    : "Continue"}
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      background: T.green,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowRight size={14} color={T.text} strokeWidth={2.5} />
                  </span>
                </button>
                <div style={{ marginTop: 12, fontSize: 12, color: T.dimmer }}>
                  press <strong style={{ color: T.dim }}>Enter ↵</strong> to continue
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function RelocationStep({
  city,
  willing,
  setWilling,
  timeline,
  setTimeline,
  onContinue,
  submitting,
}: {
  city: string;
  willing: boolean | null;
  setWilling: (v: boolean) => void;
  timeline: RelocationTimeline | null;
  setTimeline: (v: RelocationTimeline) => void;
  onContinue: () => void;
  submitting: boolean;
}) {
  const pillBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    borderRadius: 99,
    border: `1.5px solid ${T.border}`,
    background: T.white,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: T.sans,
    color: T.text,
    cursor: "pointer",
    transition: "all 150ms ease",
  };
  const pillSelected: React.CSSProperties = {
    background: T.green,
    borderColor: T.green,
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "clamp(22px, 4vw, 28px)",
          fontWeight: 600,
          color: T.text,
          letterSpacing: "-0.01em",
          marginBottom: 20,
          lineHeight: 1.2,
        }}
      >
        Are you willing to relocate to Bangalore if selected?
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setWilling(true)}
          style={{ ...pillBase, ...(willing === true ? pillSelected : {}) }}
        >
          Yes, I can relocate
        </button>
        <button
          onClick={() => setWilling(false)}
          style={{ ...pillBase, ...(willing === false ? pillSelected : {}) }}
        >
          No, I prefer {city || "my city"}
        </button>
      </div>

      {willing === false && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            color: "#991b1b",
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          <Info size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            We're currently only hiring for Bangalore-based roles. We'll keep you posted when we expand to {city || "your city"}.
          </div>
        </div>
      )}

      {willing === true && (
        <div style={{ marginTop: 8 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: T.text,
              marginBottom: 16,
            }}
          >
            How soon can you relocate?
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeline(opt.value)}
                style={{
                  ...pillBase,
                  ...(timeline === opt.value ? pillSelected : {}),
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={onContinue}
            disabled={!timeline || submitting}
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
              fontSize: 15,
              fontWeight: 500,
              fontFamily: T.sans,
              cursor: submitting ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              opacity: !timeline || submitting ? 0.5 : 1,
              transition: "opacity 150ms ease",
            }}
          >
            {submitting ? "Starting…" : "Continue"}
            <span
              style={{
                width: 28,
                height: 28,
                background: T.green,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ArrowRight size={14} color={T.text} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
