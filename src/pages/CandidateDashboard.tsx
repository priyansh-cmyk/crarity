import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  ClipboardCheck,
  Zap,
  Eye,
  Briefcase,
  BadgeCheck,
  ScanSearch,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CandidateLayout from "@/components/dashboard/CandidateLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  white: "#ffffff",
  off: "#fafaf8",
  green: "#C5E831",
  greenSoft: "rgba(197, 232, 49, 0.18)",
  greenStrong: "#16a34a",
};

type GameScore = {
  score?: number;
  total_score?: number;
  feedback?: string;
};

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  total_score: number;
  scores: Record<string, GameScore> | null;
  languages: string[] | null;
  resume_url: string | null;
  comfortable_with_office: boolean | null;
  profile_completed: boolean;
  candidate_status: string;
  completed: boolean;
  admin_approved: boolean;
};

type Interview = {
  id: string;
  scheduled_at: string;
  status: string;
  google_meet_link: string | null;
  duration_minutes: number;
  interview_type: string;
  employer_id: string;
  company_name?: string | null;
};

const STATUS_OPTIONS: { value: string; label: string; tone: "green" | "gray" }[] = [
  { value: "looking", label: "Looking for a Job", tone: "green" },
  { value: "hired", label: "Hired", tone: "gray" },
  { value: "break", label: "Taking a Break", tone: "gray" },
];

const GAMES: { key: string; name: string }[] = [
  { key: "game1", name: "Pick Your Shot" },
  { key: "game2", name: "Say It Like You Mean It" },
  { key: "game3", name: "Beyond The Student" },
  { key: "game4", name: "Handle the Heat" },
];

// Steps shown in the pipeline card
type PipelineStep = { label: string; sublabel: string; state: "done" | "active" | "pending"; icon: React.ElementType };

function getPipeline(session: Session): PipelineStep[] {
  const aiDone = typeof session.total_score === "number" && session.total_score > 0;
  const approved = session.admin_approved === true;
  // review.status === "reviewed" means admin has scored but not necessarily approved
  const reviewed = approved || (session.scores as any)?.review?.status === "reviewed";

  return [
    {
      label: "Submitted",
      sublabel: "Assessment received",
      state: "done" as const,
      icon: ClipboardCheck,
    },
    {
      label: "AI Scoring",
      sublabel: aiDone ? "Complete" : "In progress",
      state: (aiDone ? "done" : "active") as "done" | "active" | "pending",
      icon: Zap,
    },
    {
      label: "Team Review",
      sublabel: approved ? "Approved" : reviewed ? "Complete" : "In queue",
      state: (approved ? "done" : reviewed ? "done" : aiDone ? "active" : "pending") as "done" | "active" | "pending",
      icon: Eye,
    },
    {
      label: "Live to Employers",
      sublabel: approved ? "Profile is live" : "Pending approval",
      state: (approved ? "active" : "pending") as "done" | "active" | "pending",
      icon: Briefcase,
    },
  ];
}


export default function CandidateDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const IS_STAGING =
    import.meta.env.VITE_APP_ENV === "staging" ||
    window.location.hostname.includes("staging") ||
    window.location.hostname.includes("crarity-git-staging");
  const debugMode = searchParams.get("debug") === "true" || IS_STAGING;
  const debugStatus = searchParams.get("status") || "looking";

  const [session, setSession] = useState<Session | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (debugMode) return;
    if (!authLoading && !user) {
      navigate("/assessment/academic-counselor/login", { replace: true });
    }
  }, [authLoading, user, navigate, debugMode]);

  useEffect(() => {
    if (debugMode) {
      setSession({
        id: "debug-session",
        name: "Debug User",
        email: "debug@test.com",
        total_score: 85,
        scores: {
          game1: { score: 22, feedback: "Strong triage instincts." },
          game2: { total_score: 21, feedback: "Solid course knowledge." },
          game3: { total_score: 21, feedback: "Confident pitch delivery." },
          game4: { total_score: 21, feedback: "Handled refund well." },
        },
        languages: ["English", "Hindi"],
        resume_url: "https://example.com/resume.pdf",
        comfortable_with_office: true,
        profile_completed: true,
        candidate_status: debugStatus,
        completed: true,
        admin_approved: searchParams.get("approved") === "true",
      });
      setInterviews(
        searchParams.get("interviews") === "true"
          ? [
              {
                id: "iv-1",
                scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
                status: "pending",
                google_meet_link: null,
                duration_minutes: 30,
                interview_type: "Initial Screening",
                employer_id: "debug-employer",
                company_name: "Acme Education",
              },
            ]
          : []
      );
      setLoading(false);
      return;
    }
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: linked } = await supabase
          .from("assessment_sessions")
          .select("id")
          .eq("updated_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if ((!linked || linked.length === 0) && user.email) {
          const { data: byEmail } = await supabase
            .from("assessment_sessions")
            .select("id")
            .eq("email", user.email)
            .is("updated_by", null)
            .order("created_at", { ascending: false })
            .limit(1);
          if (byEmail && byEmail[0]) {
            await supabase.rpc("link_session_to_user", { _session_id: byEmail[0].id });
          }
        }

        const { data: s } = await supabase
          .from("assessment_sessions")
          .select(
            "id, name, email, total_score, scores, languages, resume_url, comfortable_with_office, profile_completed, candidate_status, completed, admin_approved"
          )
          .eq("updated_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        setSession((s as unknown as Session) ?? null);

        if (s?.id) {
          // Real-time: re-fetch session whenever admin_approved / total_score / scores changes
          supabase
            .channel(`session-status:${s.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "assessment_sessions",
                filter: `id=eq.${s.id}`,
              },
              (payload) => {
                if (cancelled) return;
                setSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        total_score: (payload.new as any).total_score ?? prev.total_score,
                        scores: (payload.new as any).scores ?? prev.scores,
                        admin_approved: (payload.new as any).admin_approved ?? prev.admin_approved,
                        candidate_status: (payload.new as any).candidate_status ?? prev.candidate_status,
                      }
                    : prev
                );
              }
            )
            .subscribe();

          const { data: ivs } = await supabase
            .from("interviews")
            .select("id, scheduled_at, status, google_meet_link, duration_minutes, interview_type, employer_id")
            .eq("session_id", s.id)
            .order("scheduled_at", { ascending: true });

          if (cancelled) return;

          if (ivs && ivs.length > 0) {
            const employerIds = Array.from(new Set(ivs.map((i: any) => i.employer_id)));
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, company_name, full_name")
              .in("id", employerIds);
            const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
            setInterviews(
              ivs.map((i: any) => ({
                ...i,
                company_name:
                  byId.get(i.employer_id)?.company_name ||
                  byId.get(i.employer_id)?.full_name ||
                  "Company",
              }))
            );
          } else {
            setInterviews([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, debugMode, debugStatus]);

  const updateStatus = async (value: string) => {
    if (!session) return;
    if (debugMode) {
      setSession({ ...session, candidate_status: value });
      toast.success("Status updated (debug)");
      return;
    }
    setSavingStatus(true);
    const prev = session.candidate_status;
    setSession({ ...session, candidate_status: value });
    const { error } = await supabase
      .from("assessment_sessions")
      .update({ candidate_status: value })
      .eq("id", session.id);
    setSavingStatus(false);
    if (error) {
      setSession({ ...session, candidate_status: prev });
      toast.error("Couldn't update status. Try again.");
    } else {
      toast.success("Status updated");
    }
  };

  const updateInterviewStatus = async (id: string, status: string) => {
    const prev = interviews;
    setInterviews(interviews.map((i) => (i.id === id ? { ...i, status } : i)));
    const { error } = await supabase
      .from("interviews")
      .update({ status })
      .eq("id", id);
    if (error) {
      setInterviews(prev);
      toast.error("Couldn't update interview. Try again.");
    } else {
      toast.success(status === "scheduled" ? "Interview accepted" : "Interview declined");
    }
  };

  const profileItems = useMemo(() => {
    if (!session) return [];
    return [
      { label: "Languages", done: !!session.languages?.length },
      { label: "Resume", done: !!session.resume_url },
    ];
  }, [session]);

  const profileComplete = profileItems.every((p) => p.done);

  if (authLoading || loading) {
    return (
      <CandidateLayout>
        <div style={{ color: T.dim, fontSize: 14 }}>Loading…</div>
      </CandidateLayout>
    );
  }

  if (!session) {
    return (
      <CandidateLayout>
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            color: T.dim,
            fontSize: 15,
          }}
        >
          We couldn't find an assessment linked to your account yet.
        </div>
      </CandidateLayout>
    );
  }

  const score = Math.round(session.total_score ?? 0);
  const pipeline = getPipeline(session);
  const currentStatus = STATUS_OPTIONS.find((o) => o.value === session.candidate_status) ?? STATUS_OPTIONS[0];
  const activeStep = pipeline.find((s) => s.state === "active");

  return (
    <CandidateLayout>
      <style>{`
        .cr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cr-iv-row { display: grid; grid-template-columns: 2fr 2fr 1fr 1.5fr; gap: 16px; align-items: center; }
        .cr-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .cr-pipeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
        @media (max-width: 640px) {
          .cr-grid-2 { grid-template-columns: 1fr !important; }
          .cr-iv-row { grid-template-columns: 1fr !important; }
          .cr-iv-head { display: none !important; }
          .cr-pipeline { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100 }}>

        {/* ── HEADER ── */}
        <div className="cr-header" style={{ marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              {session.name || user?.email?.split("@")[0] || "Welcome"}
            </h1>
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: T.green,
                  color: T.text,
                  borderRadius: 99,
                  padding: "7px 16px",
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: "-0.01em",
                }}
              >
                {score}/100
              </span>
              <span style={{ fontSize: 14, color: T.dim }}>Assessment score</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={savingStatus}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: T.white,
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 99,
                  padding: "10px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: T.sans,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: currentStatus.tone === "green" ? T.green : "#aaaaaa",
                  }}
                />
                {currentStatus.label}
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => updateStatus(opt.value)}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: opt.tone === "green" ? T.green : "#aaaaaa", marginRight: 8, display: "inline-block" }} />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── PIPELINE STATUS CARD ── */}
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: "32px 36px",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>Application Status</div>
              {activeStep && (
                <div style={{ fontSize: 13, color: T.dim, marginTop: 4 }}>
                  {activeStep.label === "Team Review" && "Your results are in the review queue — usually within 24–48 hours"}
                  {activeStep.label === "AI Scoring" && "Your answers are being scored — usually takes 1–2 minutes"}
                  {activeStep.label === "Live to Employers" && "Employers are browsing your profile right now"}
                </div>
              )}
            </div>
            {session.admin_approved && (
              <span style={{ background: T.green, color: T.text, fontWeight: 700, fontSize: 12, padding: "5px 14px", borderRadius: 99, letterSpacing: "0.01em" }}>
                ✓ Approved
              </span>
            )}
          </div>

          <div className="cr-pipeline" style={{ gap: 0, alignItems: "flex-start" }}>
            {pipeline.map((step, i) => (
              <PipelineStep key={step.label} step={step} index={i} total={pipeline.length} />
            ))}
          </div>
        </div>

        {/* ── PROFILE INCOMPLETE BANNER ── */}
        {!profileComplete && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>Your profile is incomplete</div>
                <div style={{ fontSize: 13, color: "#a16207", marginTop: 2 }}>
                  Add {profileItems.filter(p => !p.done).map(p => p.label.toLowerCase()).join(" and ")} so employers know more about you.
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/assessment/academic-counselor/profile?session=${session.id}`)}
              style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 99, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, flexShrink: 0 }}
            >
              Complete profile
            </button>
          </div>
        )}

        {/* ── INTERVIEW INVITATIONS ── */}
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 16px" }}>
          Interview Invitations
        </h2>

        {interviews.length === 0 ? (
          <InterviewEmptyState approved={session.admin_approved} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {interviews.map((iv) => {
              const date = new Date(iv.scheduled_at);
              const dateStr = date.toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
              const statusPill = pillForStatus(iv.status);
              return (
                <div key={iv.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{iv.company_name}</div>
                      <div style={{ fontSize: 13, color: T.dim, marginTop: 3 }}>{iv.interview_type} · {iv.duration_minutes} min</div>
                      <div style={{ fontSize: 13, color: T.dim, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarIcon size={12} /> {dateStr}
                      </div>
                    </div>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: statusPill.bg, color: statusPill.fg, border: `1px solid ${statusPill.border}`, flexShrink: 0 }}>
                      {statusPill.label}
                    </span>
                  </div>
                  {iv.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => updateInterviewStatus(iv.id, "scheduled")} style={pillBtnStyle("solid")}>Accept Interview</button>
                      <button onClick={() => updateInterviewStatus(iv.id, "declined")} style={pillBtnStyle("ghost")}>Decline</button>
                    </div>
                  )}
                  {iv.status === "scheduled" && iv.google_meet_link && (
                    <a href={iv.google_meet_link} target="_blank" rel="noreferrer" style={pillBtnStyle("solid") as any}>
                      Join Meeting →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}


        {/* ── PERFORMANCE ── */}
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: "40px 0 16px" }}>
          Your Performance
        </h2>
        <div className="cr-grid-2" style={{ marginBottom: 8 }}>
          {GAMES.map((g) => {
            const data = (session.scores ?? {})[g.key] ?? {};
            const val = g.key === "game1" ? data.score ?? data.total_score ?? 0 : data.total_score ?? 0;
            const pct = Math.round((Number(val) / 25) * 100);
            return (
              <div key={g.key} style={{ background: T.white, border: "1px solid #e5e5e5", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, color: T.dim, fontWeight: 500, marginBottom: 10 }}>{g.name}</div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.text, lineHeight: 1 }}>{Math.round(Number(val) || 0)}<span style={{ fontSize: 14, color: T.dim, fontWeight: 500 }}>/25</span></div>
                  <div style={{ fontSize: 13, color: T.dim }}>{pct}%</div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: "#f0efec", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 70 ? T.green : pct >= 50 ? "#fbbf24" : "#f87171", borderRadius: 99, transition: "width 600ms ease" }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </CandidateLayout>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────────────────

function PipelineStep({ step, index, total }: { step: PipelineStep; index: number; total: number }) {
  const { state, label, sublabel, icon: Icon } = step;
  const isLast = index === total - 1;
  const isDone = state === "done";
  const isActive = state === "active";
  const isPending = state === "pending";

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Connector line — sits behind the icon */}
      {!isLast && (
        <div style={{
          position: "absolute",
          top: 24,
          left: "calc(50% + 26px)",
          right: "calc(-50% + 26px)",
          height: 1.5,
          background: isDone ? T.text : "#e8e3d8",
          zIndex: 0,
        }} />
      )}

      {/* Icon circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: isDone ? T.text : isActive ? T.green : "#f4f3f0",
          border: isActive ? `2px solid ${T.text}` : isDone ? "none" : `1.5px solid #e8e3d8`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
          transition: "background 300ms",
        }}
      >
        <Icon
          size={20}
          color={isDone ? "#fff" : isActive ? T.text : "#c0bdb6"}
          strokeWidth={isDone ? 2 : 1.75}
        />
      </div>

      {/* Labels */}
      <div style={{ textAlign: "center", marginTop: 14, paddingLeft: 4, paddingRight: 4 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: isPending ? "#c0bdb6" : T.text,
          letterSpacing: "-0.01em",
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 12,
          color: isPending ? "#d0cdc6" : T.dim,
          lineHeight: 1.5,
        }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}

function InterviewEmptyState({ approved }: { approved: boolean }) {
  if (approved) {
    return (
      <div style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "36px 28px",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BadgeCheck size={24} color={T.text} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>
              Congratulations! Your profile is now live and shown to employers.
            </div>
            <div style={{ fontSize: 14, color: T.dim, lineHeight: 1.65, marginBottom: 16 }}>
              When a company wants to meet you, they'll send an interview request directly here.
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.dim }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block" }} />
                Keep your status updated so employers know you're available
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "36px 28px",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0efec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ScanSearch size={22} color={T.dim} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            Your application is currently being reviewed!
          </div>
          <div style={{ fontSize: 14, color: T.dim, lineHeight: 1.65, marginBottom: 16 }}>
            Once approved, your profile goes live and employers can see and contact you — this usually takes 12–14 hours.
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.dim }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
              You'll get an email when your profile is approved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function pillForStatus(s: string) {
  switch (s) {
    case "scheduled": return { label: "Confirmed", bg: "#E6F4D7", fg: "#3d6b00", border: "#C5E831" };
    case "completed": return { label: "Completed", bg: "#f1f1ee", fg: "#6b6b6b", border: "#e8e3d8" };
    case "declined": return { label: "Declined", bg: "#f1f1ee", fg: "#6b6b6b", border: "#e8e3d8" };
    default: return { label: "Awaiting reply", bg: "#FFF4CE", fg: "#7a5a00", border: "#F0D265" };
  }
}

function pillBtnStyle(variant: "solid" | "ghost"): React.CSSProperties {
  if (variant === "solid") {
    return { background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 99, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: '"Satoshi", system-ui, sans-serif', textDecoration: "none", display: "inline-block" };
  }
  return { background: "transparent", color: "#1a1a1a", border: "1px solid #e8e3d8", borderRadius: 99, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: '"Satoshi", system-ui, sans-serif' };
}
