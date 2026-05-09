import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAssessmentTelemetry } from "@/hooks/useAssessmentTelemetry";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  white: "#ffffff",
  off: "#f7f6f3",
  green: "#C5E831",
  border: "#e5e5e5",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  gray: "#9ca3af",
  bubbleGray: "#e5e5e5",
  red: "#dc2626",
  warnBg: "#FFF9E6",
  macRed: "#ff5f57",
  macYellow: "#ffbd2e",
  macGreen: "#28c840",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type Phase = "context" | "main" | "scoring" | "saving";
type Turn = 1 | 2;

type Scores = {
  empathy: number;
  policy_communication: number;
  alternatives: number;
  threat_handling: number;
  professionalism: number;
  total_score: number;
  feedback: string;
};

const TIME_LIMIT = 4 * 60;
const CHAR_LIMIT = 300;

const TURN1_MSG =
  "Hi, I enrolled my daughter Priya in your NEET course 10 days ago and she attended 3 classes but doesn't like it because the teaching style doesn't suit her - I want a full refund of ₹50,000 and please process this immediately.";

const TURN2_MSG =
  "You're just trying to scam parents and I'll post bad reviews on Google and Facebook and tell everyone in our parent groups not to trust your company - give me my refund NOW or I'm calling consumer court and I'm CC'ing consumer forum on this message!";

const OTHER_CONVERSATIONS = [
  { name: "Anjali Sharma", preview: "Course inquiry for NEET 2027", time: "9:12 AM" },
  { name: "Vikram Patel", preview: "Demo schedule confirmation", time: "8:55 AM" },
  { name: "Priya Nair", preview: "Payment question - EMI plan", time: "Yesterday" },
  { name: "Deepa Iyer", preview: "Enrollment help needed", time: "Yesterday" },
];

export default function AcademicCounselorGame4() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const debugMode = params.get("debug") === "true";
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";

  useAssessmentTelemetry(sessionId, "game-4");

  const [phase, setPhase] = useState<Phase>("context");
  const [turn, setTurn] = useState<Turn>(1);
  const [response, setResponse] = useState("");
  const [turn1Response, setTurn1Response] = useState("");
  const [turn2Response, setTurn2Response] = useState("");
  const [showContinue, setShowContinue] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [parentTyping, setParentTyping] = useState(false);
  const [showTurn2Msg, setShowTurn2Msg] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [autoSubmitMsg, setAutoSubmitMsg] = useState(false);

  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (debugMode) return;
    if (!sessionId) {
      toast({
        title: "Missing session",
        description: "Please restart the assessment.",
        variant: "destructive",
      });
      fadeNavigate("/assessment/academic-counselor");
    }
  }, [sessionId, fadeNavigate, debugMode]);

  useEffect(() => {
    if (phase !== "main") return;
    startedAtRef.current = Date.now();
    setTimeLeft(TIME_LIMIT);
    tickRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const left = Math.max(0, TIME_LIMIT - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        if (tickRef.current) window.clearInterval(tickRef.current);
        if (!submittedRef.current) {
          setAutoSubmitMsg(true);
          window.setTimeout(() => finalSubmit(true), 600);
        }
      }
    }, 250);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turn, parentTyping, showTurn2Msg, turn1Response]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleTurnSubmit = () => {
    if (transitioning) return;
    const text = response.trim();
    if (!text) return;

    if (turn === 1) {
      setTurn1Response(text);
      setResponse("");
      setTransitioning(true);
      // Show typing immediately, then parent message after 3s
      window.setTimeout(() => setParentTyping(true), 600);
      window.setTimeout(() => {
        setParentTyping(false);
        setTurn(2);
        setShowTurn2Msg(true);
        setTransitioning(false);
      }, 3600);
    } else {
      setTurn2Response(text);
      setResponse("");
      setShowContinue(true);
    }
  };

  const finalSubmit = async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (tickRef.current) window.clearInterval(tickRef.current);

    const t1 = turn1Response.trim();
    const t2 = (turn === 2 ? response.trim() : turn2Response.trim()) || turn2Response.trim();
    const elapsed = Math.min(TIME_LIMIT, Math.round((Date.now() - startedAtRef.current) / 1000));

    if (debugMode || !sessionId) {
      fadeNavigate(`/assessment/academic-counselor/filter-3?debug=true${roleQs}`);
      return;
    }

    setPhase("scoring");

    const combined = [t1 ? `Turn 1 reply:\n${t1}` : "", t2 ? `Turn 2 reply (after threat):\n${t2}` : ""]
      .filter(Boolean)
      .join("\n\n");

    let scores: Scores | null = null;

    if (combined.length === 0) {
      scores = {
        empathy: 0,
        policy_communication: 0,
        alternatives: 0,
        threat_handling: 0,
        professionalism: 0,
        total_score: 0,
        feedback: auto ? "No response submitted (time expired)." : "No response submitted.",
      };
    } else {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await supabase.functions.invoke("score-counselor-refund", {
            body: { response: combined },
          });
          if (res.error) throw new Error(res.error.message || "scoring failed");
          scores = res.data as Scores;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
      if (!scores) {
        scores = {
          empathy: 0,
          policy_communication: 0,
          alternatives: 0,
          threat_handling: 0,
          professionalism: 0,
          total_score: 5,
          feedback: "Provisional score — scoring service unavailable. Flagged for manual review.",
        };
      }
    }

    setPhase("saving");
    try {
      const { data: row } = await supabase
        .from("assessment_sessions_public")
        .select("scores")
        .eq("id", sessionId)
        .maybeSingle();

      const prev = (row?.scores as Record<string, unknown>) ?? {};
      const game1 = (prev as { game1?: { score?: number } }).game1?.score ?? 0;
      const game2 = (prev as { game2?: { total_score?: number } }).game2?.total_score ?? 0;
      const game3 = (prev as { game3?: { total_score?: number } }).game3?.total_score ?? 0;
      const game4 = scores.total_score ?? 0;
      const total = game1 + game2 + game3 + game4;

      const merged = {
        ...prev,
        game4: {
          turn1_response: t1,
          turn2_response: t2,
          refund_turn1_response: t1,
          refund_turn2_response: t2,
          response_text: combined,
          response_length: combined.length,
          time_taken: elapsed,
          rubric_scores: {
            empathy: scores.empathy,
            policy_communication: scores.policy_communication,
            alternatives: scores.alternatives,
            threat_handling: scores.threat_handling,
            professionalism: scores.professionalism,
          },
          total_score: scores.total_score,
          feedback: scores.feedback,
          auto_submitted: auto,
          timestamp: new Date().toISOString(),
        },
      };

      await supabase
        .from("assessment_sessions")
        .update({
          scores: merged,
          current_step: "filter-3",
          total_score: total,
          completed: true,
        })
        .eq("id", sessionId);

      fadeNavigate(`/assessment/academic-counselor/filter-3?session=${sessionId}${roleQs}`);
    } catch {
      toast({
        title: "Couldn't save your progress",
        description: "Please try again.",
        variant: "destructive",
      });
      submittedRef.current = false;
      setPhase("main");
    }
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
          padding: 48,
          ...pageStyle,
        }}
      >
        <style>{`@keyframes g4FadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
        <div style={{ maxWidth: 600, width: "100%", animation: "g4FadeUp 320ms ease" }}>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: "0 0 24px",
              color: T.text,
            }}
          >
            Handle the Heat
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: T.dim, margin: "0 0 32px" }}>
            An enrolled parent requests a full refund after 10 days, but company policy allows refunds only within 7
            days. You have to handle this situation with judgment, ethics, and empathy.
          </p>
          <button onClick={() => setPhase("main")} style={pillBtn(true)}>
            Got it, start
            <ArrowCircle />
          </button>
        </div>
      </div>
    );
  }

  if (phase === "scoring" || phase === "saving") {
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
          padding: 24,
          textAlign: "center",
          ...pageStyle,
        }}
      >
        <style>{`@keyframes g4pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }`}</style>
        <div style={{ animation: "g4pulse 1.6s ease-in-out infinite" }}>
          {autoSubmitMsg
            ? "Time's up! Submitting your response…"
            : phase === "scoring"
              ? "Analyzing your response…"
              : "Loading your results…"}
        </div>
      </div>
    );
  }

  // ============ MAIN ============
  const timerRed = timeLeft < 60;
  const charsUsed = response.length;
  const canSubmit = response.trim().length >= 1 && !transitioning && !parentTyping && !showContinue;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.white,
        fontFamily: T.sans,
        color: T.text,
        padding: "24px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...pageStyle,
      }}
    >
      <style>{`
        @keyframes g4FadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes g4BubbleIn { from { opacity: 0; transform: translateY(6px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes g4Dot { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8) } 40% { opacity: 1; transform: scale(1) } }
        .g4-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:${T.dim}; margin: 0 2px; animation: g4Dot 1.2s infinite ease-in-out; }
        .g4-dot:nth-child(2) { animation-delay: 0.15s; }
        .g4-dot:nth-child(3) { animation-delay: 0.3s; }
        .g4-body { display: flex; flex: 1; min-height: 0; }
        .g4-sidebar { width: 30%; max-width: 320px; min-width: 240px; background: ${T.off}; border-right: 1px solid ${T.border}; display: flex; flex-direction: column; }
        .g4-main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: ${T.white}; }
        @media (max-width: 720px) {
          .g4-sidebar { display: none; }
        }
      `}</style>

      {/* Timer */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 24,
          fontSize: 16,
          fontWeight: 600,
          color: timerRed ? T.red : T.dim,
          fontVariantNumeric: "tabular-nums",
          zIndex: 5,
        }}
      >
        {fmtTime(timeLeft)}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          height: "min(700px, calc(100vh - 48px))",
          background: T.white,
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          animation: "g4FadeUp 280ms ease",
        }}
      >
        {/* Mac title bar */}
        <div
          style={{
            height: 36,
            background: "#f1f1f1",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Dot color={T.macRed} />
          <Dot color={T.macYellow} />
          <Dot color={T.macGreen} />
          <div style={{ flex: 1, textAlign: "center", fontSize: 14, color: T.text, fontWeight: 500 }}>Messages</div>
          <div style={{ width: 52 }} />
        </div>

        <div className="g4-body">
          {/* SIDEBAR */}
          <aside className="g4-sidebar">
            <div style={{ padding: 20, fontSize: 18, fontWeight: 700, color: T.text }}>Messages</div>
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
              <ConversationItem
                name="Ramesh Kumar"
                preview={
                  turn === 1
                    ? "Hi, I enrolled my daughter Priya in your NEET course 10 days ago..."
                    : "You're just trying to scam parents..."
                }
                time={turn === 1 ? "9:30 AM" : "9:33 AM"}
                active
              />
              {OTHER_CONVERSATIONS.map((c, i) => (
                <ConversationItem key={i} {...c} />
              ))}
            </div>
          </aside>

          {/* MAIN */}
          <section className="g4-main">
            {/* Contact header */}
            <div
              style={{
                padding: "12px 20px",
                borderBottom: `1px solid ${T.border}`,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Ramesh Kumar</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Parent</div>
            </div>

            {/* Thread */}
            <div
              ref={threadRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: T.white,
              }}
            >
              {/* Turn 1 parent message */}
              <ParentBubble text={TURN1_MSG} time="9:30 AM" />

              {turn === 1 && (
                <div
                  style={{
                    background: T.warnBg,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 14,
                    color: T.text,
                    maxWidth: 500,
                    marginTop: 4,
                  }}
                >
                  ⚠️ <strong>Company Policy:</strong> Refund within 7 days only
                </div>
              )}

              {/* User Turn 1 reply */}
              {turn1Response && <UserBubble text={turn1Response} />}

              {/* Typing indicator */}
              {parentTyping && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: T.bubbleGray,
                    borderRadius: 18,
                    padding: "12px 16px",
                    animation: "g4BubbleIn 240ms ease",
                  }}
                >
                  <span className="g4-dot" />
                  <span className="g4-dot" />
                  <span className="g4-dot" />
                </div>
              )}

              {/* Turn 2 parent message */}
              {showTurn2Msg && <ParentBubble text={TURN2_MSG} time="9:33 AM" />}

              {/* User Turn 2 reply */}
              {turn2Response && <UserBubble text={turn2Response} />}

              {/* Continue button */}
              {showContinue && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 16,
                    animation: "g4FadeUp 240ms ease",
                  }}
                >
                  <button onClick={() => finalSubmit(false)} style={pillBtn(true)}>
                    Continue
                    <ArrowCircle />
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            {!showContinue && (
              <div
                style={{
                  borderTop: `1px solid ${T.border}`,
                  padding: 16,
                  background: T.white,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea
                      value={response}
                      onChange={(e) => {
                        if (e.target.value.length <= CHAR_LIMIT) setResponse(e.target.value);
                      }}
                      disabled={transitioning || parentTyping}
                      placeholder="Type your message..."
                      rows={1}
                      style={{
                        display: "block",
                        width: "100%",
                        minHeight: 44,
                        maxHeight: 120,
                        border: `1px solid ${T.border}`,
                        borderRadius: 20,
                        padding: "12px 60px 12px 16px",
                        fontSize: 14,
                        lineHeight: 1.4,
                        fontFamily: T.sans,
                        color: T.text,
                        background: T.white,
                        outline: "none",
                        resize: "none",
                        boxSizing: "border-box",
                        transition: "border-color 150ms ease",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = T.text)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (canSubmit) handleTurnSubmit();
                        }
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 14,
                        bottom: 6,
                        fontSize: 11,
                        color: T.gray,
                        pointerEvents: "none",
                      }}
                    >
                      {charsUsed}/{CHAR_LIMIT}
                    </div>
                  </div>
                  <button
                    onClick={handleTurnSubmit}
                    disabled={!canSubmit}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: canSubmit ? T.green : T.gray,
                      border: "none",
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 150ms ease",
                    }}
                    aria-label="Send"
                  >
                    <ArrowUp size={18} color={canSubmit ? T.text : "#fff"} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ============ helpers ============

function pillBtn(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    background: active ? T.text : T.gray,
    color: "#fff",
    border: "none",
    borderRadius: 99,
    paddingLeft: 24,
    paddingRight: active ? 8 : 24,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: T.sans,
    cursor: active ? "pointer" : "not-allowed",
    boxShadow: active ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
    transition: "all 150ms ease",
  };
}

function ArrowCircle() {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        background: T.green,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ArrowRight size={14} color={T.text} strokeWidth={2.5} />
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
      }}
    />
  );
}

function ParentBubble({ text, time }: { text: string; time: string }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", animation: "g4BubbleIn 280ms ease" }}
    >
      <div
        style={{
          background: T.bubbleGray,
          color: T.text,
          borderRadius: 18,
          padding: "12px 16px",
          maxWidth: 500,
          fontSize: 14,
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
      <div style={{ fontSize: 11, color: T.gray, marginTop: 4, marginLeft: 8 }}>{time}</div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "g4BubbleIn 280ms ease" }}>
      <div
        style={{
          background: T.green,
          color: T.text,
          borderRadius: 18,
          padding: "12px 16px",
          maxWidth: 500,
          fontSize: 14,
          lineHeight: 1.45,
          fontWeight: 500,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ConversationItem({
  name,
  preview,
  time,
  active,
}: {
  name: string;
  preview: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderLeft: `3px solid ${active ? T.green : "transparent"}`,
        background: active ? T.white : "transparent",
        opacity: active ? 1 : 0.3,
        filter: active ? "none" : "blur(4px)",
        userSelect: active ? "auto" : "none",
        marginBottom: 2,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: T.text,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 11, color: T.gray, whiteSpace: "nowrap" }}>{time}</div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: T.dim,
          marginTop: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {preview}
      </div>
    </div>
  );
}
