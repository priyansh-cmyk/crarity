import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  Calendar as CalendarIcon,
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

export default function CandidateDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";
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
      });
      setInterviews([
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
      ]);
      setLoading(false);
      return;
    }
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Try to claim any unlinked session by email match (best-effort)
      try {
        // Find latest session for this user (already linked OR by email)
        const { data: linked } = await supabase
          .from("assessment_sessions")
          .select("id")
          .eq("updated_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if ((!linked || linked.length === 0) && user.email) {
          // Find session by email and try linking each one we can see
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
            "id, name, email, total_score, scores, languages, resume_url, comfortable_with_office, profile_completed, candidate_status, completed"
          )
          .eq("updated_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        setSession((s as unknown as Session) ?? null);

        if (s?.id) {
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
    return () => {
      cancelled = true;
    };
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
  const scoreTone = { bg: "#C5E831", fg: "#1a1a1a" };

  const currentStatus = STATUS_OPTIONS.find((o) => o.value === session.candidate_status) ?? STATUS_OPTIONS[0];

  return (
    <CandidateLayout>
      <style>{`
        .cr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cr-iv-row { display: grid; grid-template-columns: 2fr 2fr 1fr 1.5fr; gap: 16px; align-items: center; }
        .cr-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .cr-grid-2 { grid-template-columns: 1fr !important; }
          .cr-iv-row { grid-template-columns: 1fr !important; }
          .cr-iv-head { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100 }}>
        {/* SECTION 1: Header + status */}
        <div className="cr-header" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              {session.name || user?.email?.split("@")[0] || "Welcome"}
            </h1>
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: scoreTone.bg,
                  color: scoreTone.fg,
                  borderRadius: 99,
                  padding: "8px 16px",
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                }}
              >
                {score}/100
              </span>
              <span style={{ fontSize: 14, color: T.dim }}>Overall score</span>
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
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
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
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: opt.tone === "green" ? T.green : "#aaaaaa",
                      marginRight: 8,
                      display: "inline-block",
                    }}
                  />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* SECTION 2: Performance */}
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 32px" }}>Your Performance</h2>
        <div className="cr-grid-2" style={{ marginBottom: 40 }}>
          {GAMES.map((g) => {
            const data = (session.scores ?? {})[g.key] ?? {};
            const val =
              g.key === "game1"
                ? data.score ?? data.total_score ?? 0
                : data.total_score ?? 0;
            return (
              <div
                key={g.key}
                style={{
                  background: T.white,
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 14, color: T.dim, fontWeight: 500, marginBottom: 8 }}>
                  {g.name}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.01em", lineHeight: 1 }}>
                  {Math.round(Number(val) || 0)}/25
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 3: Interviews */}
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 24px" }}>Interview Invitations</h2>
        {interviews.length === 0 ? (
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "48px 24px",
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#f1f1ee",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <CalendarIcon size={32} color={T.dim} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: T.text, marginBottom: 6 }}>
              No interview invitations yet
            </div>
            <div style={{ fontSize: 14, color: T.dim }}>
              Companies will reach out when they're interested!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {interviews.map((iv) => {
              const date = new Date(iv.scheduled_at);
              const dateStr = date.toLocaleString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
              const statusPill = pillForStatus(iv.status);
              return (
                <div
                  key={iv.id}
                  style={{
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                    {iv.company_name}
                  </div>
                  <div style={{ fontSize: 14, color: T.dim, marginBottom: 2 }}>{dateStr}</div>
                  <div style={{ fontSize: 14, color: T.dim, marginBottom: 14 }}>
                    {iv.interview_type}
                  </div>
                  <div style={{ marginBottom: iv.status === "pending" || (iv.status === "scheduled" && iv.google_meet_link) ? 16 : 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 600,
                        background: statusPill.bg,
                        color: statusPill.fg,
                        border: `1px solid ${statusPill.border}`,
                      }}
                    >
                      {statusPill.label}
                    </span>
                  </div>
                  {iv.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => updateInterviewStatus(iv.id, "scheduled")}
                        style={pillBtnStyle("solid")}
                      >
                        Accept Interview
                      </button>
                      <button
                        onClick={() => updateInterviewStatus(iv.id, "declined")}
                        style={pillBtnStyle("ghost")}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {iv.status === "scheduled" && iv.google_meet_link && (
                    <a
                      href={iv.google_meet_link}
                      target="_blank"
                      rel="noreferrer"
                      style={pillBtnStyle("solid") as any}
                    >
                      Join Meeting
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 4: Profile completeness */}
        {!profileComplete && (
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Complete your profile</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {profileItems.map((p) => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: p.done ? T.text : T.dim }}>
                  {p.done ? <CheckCircle2 size={16} color={T.greenStrong} /> : <Circle size={16} />}
                  {p.label}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(`/assessment/academic-counselor/profile?session=${session.id}`)}
              style={pillBtnStyle("solid")}
            >
              Complete your profile
            </button>
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}

function pillForStatus(s: string) {
  switch (s) {
    case "scheduled":
      return { label: "Scheduled", bg: "#E6F4D7", fg: "#3d6b00", border: "#C5E831" };
    case "completed":
      return { label: "Completed", bg: "#f1f1ee", fg: "#6b6b6b", border: "#e8e3d8" };
    case "declined":
      return { label: "Declined", bg: "#f1f1ee", fg: "#6b6b6b", border: "#e8e3d8" };
    default:
      return { label: "Pending", bg: "#FFF4CE", fg: "#7a5a00", border: "#F0D265" };
  }
}

function pillBtnStyle(variant: "solid" | "ghost"): React.CSSProperties {
  if (variant === "solid") {
    return {
      background: "#1a1a1a",
      color: "#fff",
      border: "none",
      borderRadius: 99,
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: '"Satoshi", system-ui, sans-serif',
      textDecoration: "none",
      display: "inline-block",
    };
  }
  return {
    background: "transparent",
    color: "#1a1a1a",
    border: "1px solid #e8e3d8",
    borderRadius: 99,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: '"Satoshi", system-ui, sans-serif',
  };
}
