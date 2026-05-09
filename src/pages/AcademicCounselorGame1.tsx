import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  MapPin,
  GraduationCap,
  MessageSquare,
  Wallet,
  Activity,
  CalendarClock,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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

type Lead = {
  id: string;
  name: string;
  city: string;
  child: string;
  inquiry: string;
  budget: string;
  activity: string;
  demo: string;
  timeline: string;
};

const LEADS: Lead[] = [
  {
    id: "anjali",
    name: "Anjali Mehta",
    city: "Pune",
    child: "Class 11 (Commerce)",
    inquiry: "Interested in CA Foundation course",
    budget: "What's the fee structure?",
    activity: "Attended webinar 2 days ago",
    demo: "Not scheduled",
    timeline: "Planning to start after boards",
  },
  {
    id: "rakesh",
    name: "Rakesh Kumar",
    city: "Lucknow",
    child: "Class 12 (Science)",
    inquiry: "Urgent help for JEE Mains",
    budget: "Can you do EMI?",
    activity: "Downloaded brochure 3 weeks ago",
    demo: "Scheduled for today 5 PM",
    timeline: "Exam in 2 months",
  },
  {
    id: "deepa",
    name: "Deepa Iyer",
    city: "Chennai",
    child: "Class 10 (CBSE)",
    inquiry: "Daughter struggling with Math",
    budget: "No mention of price",
    activity: "Filled inquiry form this morning",
    demo: "Not scheduled",
    timeline: "Boards in 10 months",
  },
  {
    id: "suresh",
    name: "Suresh Patil",
    city: "Nagpur",
    child: "Class 12 (Commerce)",
    inquiry: "CA course vs CMA course - confused",
    budget: "Father works in accounting firm",
    activity: "Attended webinar 1 week ago, asked 3 questions",
    demo: "Not scheduled",
    timeline: "Want to decide this week",
  },
  {
    id: "priya",
    name: "Priya Reddy",
    city: "Hyderabad",
    child: "Class 9 (ICSE)",
    inquiry: "Foundation batch for competitive exams",
    budget: "Premium tier interest",
    activity: "Parent called yesterday asking for callback",
    demo: "Not scheduled",
    timeline: "Looking to start in 2 weeks",
  },
  {
    id: "vikram",
    name: "Vikram Joshi",
    city: "Mumbai",
    child: "Class 11 (Science)",
    inquiry: "Comparing with another coaching institute",
    budget: "They're offering 15% off",
    activity: "Submitted inquiry 4 days ago",
    demo: "Not scheduled",
    timeline: "Decision by end of month",
  },
  {
    id: "meera",
    name: "Meera Nair",
    city: "Kochi",
    child: "Class 12 (Commerce)",
    inquiry: "Need crash course for board exam preparation",
    budget: "Can pay ₹30,000 immediately",
    activity: "WhatsApp message sent 10 minutes ago: 'Still interested?'",
    demo: "Not scheduled",
    timeline: "Boards in 3 months, needs to start NOW",
  },
  {
    id: "arjun",
    name: "Arjun Desai",
    city: "Ahmedabad",
    child: "Class 10 (CBSE)",
    inquiry: "General inquiry about foundation courses",
    budget: "Asked about scholarship options",
    activity: "Attended webinar last month",
    demo: "Not scheduled",
    timeline: "Wants more information first",
  },
];

const CORRECT = new Set(["rakesh", "suresh", "meera"]);

const SCORE_BY_CORRECT: Record<number, number> = { 0: 0, 1: 10, 2: 17.5, 3: 25 };

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function InfoLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: T.text, lineHeight: 1.45 }}>
      <span style={{ color: T.dim, marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

function ContextScreen({ onStart }: { onStart: () => void }) {
  const [count, setCount] = useState(10);
  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: T.sans,
        color: T.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 600, width: "100%" }}>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: 24,
            marginTop: 0,
            color: "#1a1a1a",
            textAlign: "left",
          }}
        >
          You're an Academic Counselor at ConceptEdu.
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#6b6b6b", marginBottom: 32, textAlign: "left" }}>
          It's Monday morning and you have 8 parent leads to follow up with, but you can only call 3 of them before your shift ends at 1 PM - which 3 should you prioritize?
        </p>

        <button
          onClick={onStart}
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
            paddingTop: 12,
            paddingBottom: 12,
            fontSize: 16,
            fontWeight: 500,
            fontFamily: T.sans,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            transition: "transform 150ms ease, box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
          }}
        >
          Got it, let's go
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

        <div style={{ marginTop: 24, fontSize: 13, color: T.dimmer }}>
          Auto-starts in {count}s
        </div>
      </div>
    </div>
  );
}

export default function AcademicCounselorGame1() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";

  const [phase, setPhase] = useState<"context" | "game">("context");
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]); // FIFO of selection order
  const [timeLeft, setTimeLeft] = useState(180);
  const [submitting, setSubmitting] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const submittedRef = useRef(false);

  // Auto-start context after 10s
  useEffect(() => {
    if (phase !== "context") return;
    const t = setTimeout(() => setPhase("game"), 10000);
    return () => clearTimeout(t);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "game") return;
    if (timeLeft <= 0) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        void submit(true);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const toggle = (id: string) => {
    setSelected((curr) => {
      if (curr.includes(id)) {
        setOrder((o) => o.filter((x) => x !== id));
        return curr.filter((x) => x !== id);
      }
      // If 3 already selected, drop the oldest (FIFO)
      if (curr.length >= 3) {
        const oldest = order[0];
        const next = curr.filter((x) => x !== oldest).concat(id);
        setOrder((o) => o.slice(1).concat(id));
        return next;
      }
      setOrder((o) => o.concat(id));
      return curr.concat(id);
    });
  };

  const correctCount = useMemo(
    () => selected.filter((id) => CORRECT.has(id)).length,
    [selected],
  );

  const submit = async (autoSubmitted = false) => {
    if (submitting) return;
    setSubmitting(true);

    const score = SCORE_BY_CORRECT[correctCount] ?? 0;

    try {
      if (sessionId) {
        // Read current scores, merge, then update
        const { data: row } = await supabase
          .from("assessment_sessions_public")
          .select("scores")
          .eq("id", sessionId)
          .maybeSingle();

        const prev = (row?.scores as Record<string, unknown>) ?? {};
        const merged = {
          ...prev,
          game1: {
            selected,
            correct: Array.from(CORRECT),
            correct_count: correctCount,
            score,
            max_score: 25,
            time_taken_seconds: 180 - timeLeft,
            auto_submitted: autoSubmitted,
            submitted_at: new Date().toISOString(),
          },
        };

        await supabase
          .from("assessment_sessions")
          .update({ scores: merged, current_step: "game-2" })
          .eq("id", sessionId);
      }

      setShowTransition(true);
      setTimeout(() => {
        fadeNavigate(`/assessment/academic-counselor/filter-1${sessionId ? `?session=${sessionId}${roleQs}` : ""}`);
      }, 1200);
    } catch (err) {
      toast({
        title: "Couldn't save",
        description: "Moving on anyway.",
        variant: "destructive",
      });
      setShowTransition(true);
      setTimeout(() => {
        fadeNavigate(`/assessment/academic-counselor/filter-1${sessionId ? `?session=${sessionId}${roleQs}` : ""}`);
      }, 1200);
    }
  };

  if (phase === "context") return <ContextScreen onStart={() => setPhase("game")} />;

  const timerRed = timeLeft <= 60;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: T.sans,
        color: T.text,
        paddingBottom: 100,
        ...pageStyle,
      }}
    >
      {showTransition && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(247, 246, 243, 0.96)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 500,
            color: "#1a1a1a",
            fontFamily: T.sans,
            animation: "g1FadeInOut 1500ms ease",
          }}
        >
          <style>{`@keyframes g1FadeInOut { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0.9; } }`}</style>
          Submitted! Loading next task…
        </div>
      )}

      {/* Sticky top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(247, 246, 243, 0.95)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: "nowrap" }}>
              Pick Your Shot
            </span>
            <span style={{ fontSize: 14, color: T.dim, whiteSpace: "nowrap" }}>
              · {selected.length}/3 selected
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 24,
              fontWeight: 700,
              color: timerRed ? T.red : T.text,
              fontVariantNumeric: "tabular-nums",
              transition: "color 200ms ease",
            }}
          >
            <Clock size={20} />
            {fmtTime(timeLeft)}
          </div>
        </div>
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 20px 14px",
            fontSize: 15,
            color: T.text,
            fontWeight: 500,
          }}
        >
          Tap 3 leads to mark as priority
        </div>
      </header>

      {/* Cards */}
      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "24px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))",
          gap: 16,
        }}
      >
        {LEADS.map((lead) => {
          const isSel = selected.includes(lead.id);
          return (
            <button
              key={lead.id}
              onClick={() => toggle(lead.id)}
              style={{
                position: "relative",
                textAlign: "left",
                background: isSel ? T.greenTint : T.white,
                border: `${isSel ? 2 : 1}px solid ${isSel ? T.green : T.border}`,
                borderRadius: 12,
                padding: isSel ? 19 : 20,
                cursor: "pointer",
                fontFamily: T.sans,
                color: T.text,
                transition: "background 150ms ease, border-color 150ms ease, transform 150ms ease",
                transform: isSel ? "translateY(-1px)" : "translateY(0)",
                boxShadow: isSel ? "0 6px 20px rgba(197, 232, 49, 0.25)" : "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              {/* Checkmark */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: isSel ? T.green : "transparent",
                  border: `1.5px solid ${isSel ? T.green : T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 150ms ease",
                }}
              >
                {isSel && <Check size={14} color={T.text} strokeWidth={3} />}
              </div>

              {/* Header */}
              <div style={{ marginBottom: 12, paddingRight: 36 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4 }}>
                  {lead.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: T.dim }}>
                  <MapPin size={13} />
                  {lead.city}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <InfoLine icon={<GraduationCap size={15} />}>{lead.child}</InfoLine>
                <InfoLine icon={<MessageSquare size={15} />}>
                  <span style={{ color: T.dim }}>Inquiry: </span>
                  {lead.inquiry}
                </InfoLine>
                <InfoLine icon={<Wallet size={15} />}>
                  <span style={{ color: T.dim }}>Budget: </span>
                  "{lead.budget}"
                </InfoLine>
                <InfoLine icon={<Activity size={15} />}>
                  <span style={{ color: T.dim }}>Last activity: </span>
                  {lead.activity}
                </InfoLine>
                <InfoLine icon={<CalendarClock size={15} />}>
                  <span style={{ color: T.dim }}>Demo: </span>
                  {lead.demo}
                </InfoLine>
                <InfoLine icon={<Clock size={15} />}>
                  <span style={{ color: T.dim }}>Timeline: </span>
                  {lead.timeline}
                </InfoLine>
              </div>
            </button>
          );
        })}
      </main>

      {/* Sticky submit bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderTop: `1px solid ${T.border}`,
          padding: "14px 20px",
          transform: selected.length === 3 ? "translateY(0)" : "translateY(110%)",
          transition: "transform 220ms ease",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => submit(false)}
            disabled={submitting || selected.length !== 3}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: T.text,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              paddingLeft: 28,
              paddingRight: 10,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16,
              fontWeight: 500,
              fontFamily: T.sans,
              cursor: submitting ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              opacity: submitting ? 0.7 : 1,
              width: "100%",
              maxWidth: 360,
              transition: "transform 150ms ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)")}
          >
            {submitting ? "Submitting…" : "Submit Answers"}
            <span
              style={{
                width: 30,
                height: 30,
                background: T.green,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowRight size={15} color={T.text} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
