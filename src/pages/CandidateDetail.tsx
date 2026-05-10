import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Check,
  X,
  Mic,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Video,
  Copy,
  Heart,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import TelemetryPanel, { type TelemetryShape } from "@/components/TelemetryPanel";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabel } from "@/lib/role-labels";
import ScheduleInterviewModal from "@/components/interviews/ScheduleInterviewModal";
import CompleteInterviewModal from "@/components/interviews/CompleteInterviewModal";
import { formatScheduledAt } from "@/lib/meet";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaa",
  border: "#e8e3d8",
  green: "#C5E831",
  white: "#ffffff",
  off: "#fafaf8",
  red: "#dc2626",
  greenDeep: "#3d6b00",
};

const PASTELS = [
  "#FDE9C9", "#D7EFD9", "#E8E0F5", "#FAD7DC",
  "#D6ECF3", "#FFF1B8", "#E8F0CB", "#F4D6E8",
];

const initials = (name: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
};

const colorFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PASTELS[h % PASTELS.length];
};

const matchBadge = (score: number) => {
  if (score >= 28) return { label: "High match", bg: "#E6F4D7", fg: T.greenDeep, border: T.green };
  if (score >= 20) return { label: "Potential", bg: "#FFF4CE", fg: "#7a5a00", border: "#F0D265" };
  return { label: "Low match", bg: "#f1f1ee", fg: T.dim, border: T.border };
};

const GAME2_QUESTIONS = [
  { q: "Which grades does this course cover?", options: ["Class 9-10", "Class 11-12", "Class 10-12", "Class 11-12-Droppers"], correct: 1 },
  { q: "What's the refund policy?", options: ["7 days full refund", "14 days full refund", "30 days partial refund", "No refunds allowed"], correct: 0 },
  { q: "How many live classes per week?", options: ["3 classes", "4 classes", "5 classes", "6 classes"], correct: 2 },
  { q: "What's the course price?", options: ["₹35,000", "₹45,000", "₹55,000", "₹65,000"], correct: 1 },
];

const G3_RUBRIC: { key: string; label: string }[] = [
  { key: "opening_context", label: "Opening & context" },
  { key: "price_handling", label: "Price handling" },
  { key: "urgency", label: "Urgency" },
  { key: "cta", label: "Call to action" },
  { key: "tone", label: "Tone" },
];

const G4_RUBRIC: { key: string; label: string }[] = [
  { key: "empathy", label: "Empathy" },
  { key: "policy_communication", label: "Policy communication" },
  { key: "alternatives", label: "Alternatives offered" },
  { key: "threat_handling", label: "Threat handling" },
  { key: "professionalism", label: "Professionalism" },
];

const EXPERIENCE_LABELS: Record<string, string> = {
  exp_lt6: "Less than 6 months",
  exp_6_12: "6–12 months",
  exp_1_2: "1–2 years",
  exp_2_5: "2–5 years",
  exp_gt5: "More than 5 years",
  none: "No prior experience",
};

type ScoresShape = {
  game1?: Record<string, unknown>;
  game2?: {
    answers?: number[];
    correct_answers?: number;
    total_score?: number;
    total_questions?: number;
  };
  game3?: {
    transcript?: string;
    audio_url?: string;
    audio_duration?: number;
    feedback?: string;
    rubric_scores?: Record<string, number>;
    total_score?: number;
    filter?: { weekend_availability?: string };
  };
  game4?: {
    response_text?: string;
    feedback?: string;
    rubric_scores?: Record<string, number>;
    total_score?: number;
  };
  filters?: { experience?: string; [k: string]: unknown };
};

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  role_id: string | null;
  role_type: string;
  total_score: number;
  completed: boolean;
  status: string;
  pipeline_status: string;
  scores: ScoresShape;
  telemetry: TelemetryShape | null;
  created_at: string;
  updated_at: string;
};

const G4_SCENARIO =
  "A parent is demanding a refund after the 7-day window. They are frustrated and threatening a chargeback. Respond professionally over chat.";

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [signedAudioUrl, setSignedAudioUrl] = useState<string | null>(null);
  const [interview, setInterview] = useState<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    interview_type: string;
    google_meet_link: string | null;
    notes: string | null;
    status: string;
  } | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<string>("new");

  const fetchInterview = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("interviews")
      .select("id, scheduled_at, duration_minutes, interview_type, google_meet_link, notes, status")
      .eq("session_id", id)
      .in("status", ["scheduled"])
      .order("scheduled_at", { ascending: true })
      .limit(1);
    setInterview((data?.[0] as typeof interview) ?? null);
  }, [id]);

  useEffect(() => {
    if (user && id) fetchInterview();
  }, [user, id, fetchInterview]);

  // Fetch this employer's pipeline entry for this candidate
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase
        .from("employer_candidate_pipeline")
        .select("status")
        .eq("employer_id", user.id)
        .eq("session_id", id)
        .maybeSingle();
      if (data) setPipelineStatus((data as { status: string }).status);
    })();
  }, [user, id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    (async () => {
      // Fetch session — accessible if admin_approved OR this employer imported it
      const { data: sess, error } = await supabase
        .from("assessment_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !sess) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Must be admin-approved OR the employer imported this candidate
      const approved = Boolean((sess as Record<string, unknown>).admin_approved);
      const invitedBy = (sess as Record<string, unknown>).invited_by;
      if (!approved && invitedBy !== user.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(sess as unknown as Session);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user, authLoading]);

  // Mint a signed URL for the private pitch recording so the employer can play it back.
  useEffect(() => {
    const url = session?.scores?.game3?.audio_url;
    if (!url) {
      setSignedAudioUrl(null);
      return;
    }
    // Extract the object path inside the bucket from the public URL.
    const marker = "/pitch-recordings/";
    const idx = url.indexOf(marker);
    if (idx === -1) {
      setSignedAudioUrl(url); // fallback: use as-is
      return;
    }
    const objectPath = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage
        .from("pitch-recordings")
        .createSignedUrl(objectPath, 3600);
      if (cancelled) return;
      if (error || !data?.signedUrl) {
        setSignedAudioUrl(null);
      } else {
        setSignedAudioUrl(data.signedUrl);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const games = useMemo(() => {
    if (!session) return [];
    const s = session.scores ?? {};
    return [
      { key: "game1", title: "Pick Your Shot", score: Number(s.game1?.score ?? s.game1?.total_score ?? 0), max: 10 },
      { key: "game2", title: "Say It Like You Mean It", score: Number(s.game2?.total_score ?? 0), max: 10 },
      { key: "game3", title: "Beyond The Student", score: Number(s.game3?.total_score ?? 0), max: 10 },
      { key: "game4", title: "Refund Response", score: Number(s.game4?.total_score ?? 0), max: 10 },
    ];
  }, [session]);

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div style={{ fontFamily: T.sans, color: T.dim, fontSize: 15 }}>Loading candidate…</div>
      </DashboardLayout>
    );
  }

  if (notFound || !session) {
    return (
      <DashboardLayout>
        <div style={{ fontFamily: T.sans, textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🔍</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>Candidate not found</h1>
          <p style={{ fontSize: 15, color: T.dim, marginBottom: 24 }}>
            This assessment doesn't exist or hasn't been approved by admin yet.
          </p>
          <Link
            to="/candidates"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: T.text, color: T.white, padding: "10px 18px",
              borderRadius: 99, fontSize: 14, fontWeight: 500, textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} /> Back to candidates
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const badge = matchBadge(session.total_score);
  const s = session.scores ?? {};

  const copy = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) {
          .cr-cd-grid2 { grid-template-columns: 1fr !important; }
          .cr-cd-contact { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .cr-cd-actions-sticky { position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important; border-radius: 0 !important; padding: 16px !important; box-shadow: 0 -4px 16px rgba(0,0,0,0.06) !important; }
          .cr-cd-main { padding-bottom: 120px !important; }
          .cr-cd-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
        }
      `}</style>

      <div className="cr-cd-main" style={{ fontFamily: T.sans, color: T.text, maxWidth: 960, margin: "0 auto", padding: "0 8px" }}>
        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.dim, marginBottom: 24 }}>
          <Link to="/candidates" style={{ color: T.dim, textDecoration: "none" }}>Candidates</Link>
          <ChevronRight size={14} />
          <span style={{ color: T.text, fontWeight: 500 }}>{session.name ?? "Candidate"}</span>
        </nav>

        {/* 1. Header */}
        <Card>
          <div className="cr-cd-header-row" style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
              <div
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: colorFor(session.id),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 600, color: T.text, flexShrink: 0,
                }}
              >
                {initials(session.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                  {session.name ?? "Unnamed"}
                </h1>
                <div style={{ fontSize: 13, color: T.dimmer, marginBottom: 12 }}>
                  {roleLabel(session.role_type)} · Submitted {new Date(session.updated_at).toLocaleDateString()}
                </div>
                <div className="cr-cd-contact" style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14, color: T.dim }}>
                  {session.email && (
                    <ContactChip icon={<Mail size={14} />} label={session.email} onClick={() => copy(session.email, "Email")} />
                  )}
                  {session.phone && (
                    <ContactChip icon={<Phone size={14} />} label={session.phone} onClick={() => copy(session.phone, "Phone")} />
                  )}
                  {session.city && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={14} /> {session.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: T.text }}>
                {session.total_score}
                <span style={{ fontSize: 20, color: T.dimmer, fontWeight: 500 }}> / 40</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: badge.bg, color: badge.fg,
                    border: `1px solid ${badge.border}`,
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Score Breakdown */}
        <SectionTitle>Score breakdown</SectionTitle>
        <Card>
          <div className="cr-cd-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {games.map((g) => (
              <div key={g.key} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{g.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                    {g.score}<span style={{ fontSize: 13, color: T.dimmer, fontWeight: 500 }}>/{g.max}</span>
                  </div>
                </div>
                <ScoreBar value={g.score} max={g.max} />
              </div>
            ))}
          </div>
        </Card>

        {/* 3. Game 2 — Say It Like You Mean It */}
        <SectionTitle>Course knowledge — answers</SectionTitle>
        <Card>
          {s.game2?.answers && s.game2.answers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {GAME2_QUESTIONS.map((q, i) => {
                const picked = s.game2?.answers?.[i];
                const isCorrect = picked === q.correct;
                return (
                  <div key={i} style={{ borderBottom: i < GAME2_QUESTIONS.length - 1 ? `1px solid ${T.border}` : "none", paddingBottom: 16 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                      <div
                        style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isCorrect ? "#E6F4D7" : "#FDE2E2",
                          color: isCorrect ? T.greenDeep : T.red,
                          marginTop: 2,
                        }}
                      >
                        {isCorrect ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                        Q{i + 1}. {q.q}
                      </div>
                    </div>
                    <div style={{ paddingLeft: 32, fontSize: 14, color: T.dim }}>
                      <div>
                        Their answer: <strong style={{ color: isCorrect ? T.greenDeep : T.red }}>
                          {picked !== undefined ? q.options[picked] : "No answer"}
                        </strong>
                      </div>
                      {!isCorrect && (
                        <div style={{ marginTop: 4 }}>
                          Correct: <strong style={{ color: T.text }}>{q.options[q.correct]}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>No answers recorded.</Empty>
          )}
        </Card>

        {/* 4. Game 3 — Beyond The Student */}
        <SectionTitle>Voice pitch</SectionTitle>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: T.off, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 20 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: "50%", background: T.green,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Mic size={18} color={T.text} />
            </div>
            <div style={{ flex: 1, fontSize: 14, color: T.dim }}>
              {s.game3?.audio_url ? (
                signedAudioUrl ? (
                  <audio controls src={signedAudioUrl} style={{ width: "100%" }} />
                ) : (
                  <span style={{ color: T.dimmer, fontSize: 13 }}>Loading recording…</span>
                )
              ) : (
                "Voice recording not available"
              )}
              {s.game3?.audio_duration ? (
                <div style={{ fontSize: 12, color: T.dimmer, marginTop: 4 }}>
                  Duration: {s.game3.audio_duration}s
                </div>
              ) : null}
            </div>
          </div>

          {s.game3?.transcript ? (
            <div style={{ marginBottom: 20 }}>
              <Label>Transcript</Label>
              <div
                style={{
                  background: T.white, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: 16, fontSize: 15, color: T.text,
                  whiteSpace: "pre-wrap", lineHeight: 1.6,
                }}
              >
                {s.game3.transcript}
              </div>
            </div>
          ) : null}

          <RubricGrid rubric={G3_RUBRIC} scores={s.game3?.rubric_scores} />

          {s.game3?.feedback ? <Feedback text={s.game3.feedback} /> : null}
        </Card>

        {/* 5. Game 4 — Refund Response */}
        <SectionTitle>Refund response</SectionTitle>
        <Card>
          <Label>Scenario</Label>
          <div style={{ fontSize: 14, color: T.dim, lineHeight: 1.6, marginBottom: 20 }}>
            {G4_SCENARIO}
          </div>

          <Label>Their response</Label>
          <div
            style={{
              background: T.white, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: 16, fontSize: 16,
              fontWeight: 400, color: T.text, whiteSpace: "pre-wrap",
              lineHeight: 1.6, marginBottom: 24,
              fontFamily: T.sans,
            }}
          >
            {s.game4?.response_text || <span style={{ color: T.dimmer }}>No response submitted.</span>}
          </div>

          <RubricGrid rubric={G4_RUBRIC} scores={s.game4?.rubric_scores} />

          {s.game4?.feedback ? <Feedback text={s.game4.feedback} /> : null}
        </Card>

        {/* 6. Experience Filter */}
        <SectionTitle>Experience</SectionTitle>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 15, color: T.dim }}>Sales experience</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
              {s.filters?.experience
                ? EXPERIENCE_LABELS[s.filters.experience] ?? s.filters.experience
                : <span style={{ color: T.dimmer, fontWeight: 400 }}>Not provided</span>}
            </div>
          </div>
          {s.game3?.filter?.weekend_availability ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 15, color: T.dim }}>Weekend availability</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>
                {s.game3.filter.weekend_availability}
              </div>
            </div>
          ) : null}
        </Card>

        {/* 6a. Scheduled Interview */}
        {interview && (
          <>
            <SectionTitle>Scheduled Interview</SectionTitle>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: T.text }}>
                    {formatScheduledAt(interview.scheduled_at)}
                  </div>
                  <div style={{ fontSize: 14, color: T.dim, marginTop: 4 }}>
                    {interview.duration_minutes} min · {interview.interview_type}
                  </div>
                  {interview.google_meet_link && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 14 }}>
                      <Video size={14} color={T.dim} />
                      <a href={interview.google_meet_link} target="_blank" rel="noreferrer"
                         style={{ color: T.text, textDecoration: "underline", fontWeight: 500 }}>
                        {interview.google_meet_link}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(interview.google_meet_link!);
                          toast.success("Meeting link copied");
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: T.dim, padding: 4 }}
                        aria-label="Copy meeting link"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  )}
                  {interview.notes && (
                    <div style={{ marginTop: 12, fontSize: 14, color: T.dim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      <strong style={{ color: T.text }}>Notes:</strong> {interview.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setScheduleOpen(true)}
                    style={{
                      background: "#fff", color: T.text, border: `1px solid ${T.border}`,
                      padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                      cursor: "pointer", fontFamily: T.sans,
                    }}
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from("interviews")
                        .update({ status: "cancelled" })
                        .eq("id", interview.id);
                      if (error) { toast.error(error.message); return; }
                      toast.success("Interview cancelled");
                      fetchInterview();
                    }}
                    style={{
                      background: "#fff", color: T.red, border: `1px solid #f3c0c0`,
                      padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                      cursor: "pointer", fontFamily: T.sans,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* 6b. Assessment integrity (telemetry) */}
        <SectionTitle>Integrity</SectionTitle>
        <TelemetryPanel telemetry={session.telemetry} />

        {/* 7. Action Buttons */}
        <div
          className="cr-cd-actions-sticky"
          style={{
            position: "sticky", bottom: 24, marginTop: 32,
            background: T.white, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: 16,
            display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <button
            onClick={async () => {
              if (!user) return;
              const next = pipelineStatus === "shortlisted" ? "new" : "shortlisted";
              const { error } = await supabase
                .from("employer_candidate_pipeline")
                .upsert(
                  { employer_id: user.id, session_id: session.id, status: next, updated_at: new Date().toISOString() },
                  { onConflict: "employer_id,session_id" }
                );
              if (error) { toast.error(error.message); return; }
              setPipelineStatus(next);
              toast.success(next === "shortlisted" ? "Candidate shortlisted!" : "Removed from shortlist");
            }}
            style={{
              background: pipelineStatus === "shortlisted" ? "#E6F4D7" : T.white,
              color: pipelineStatus === "shortlisted" ? "#3d6b00" : T.text,
              border: `1.5px solid ${pipelineStatus === "shortlisted" ? "#C5E831" : T.border}`,
              padding: "10px 20px", borderRadius: 99, fontSize: 14,
              fontWeight: 500, cursor: "pointer", fontFamily: T.sans,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <Heart size={14} fill={pipelineStatus === "shortlisted" ? "#3d6b00" : "none"} />
            {pipelineStatus === "shortlisted" ? "Shortlisted" : "Shortlist"}
          </button>
          <button
            onClick={() => setScheduleOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: T.text, color: "#fff", border: "none",
              padding: "10px 12px 10px 20px", borderRadius: 99, fontSize: 14,
              fontWeight: 500, cursor: "pointer", fontFamily: T.sans,
            }}
          >
            {interview ? "Reschedule Interview" : "Request Interview"}
            <span
              style={{
                width: 24, height: 24, borderRadius: "50%", background: T.green,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: T.text,
              }}
            >
              <ArrowRight size={12} />
            </span>
          </button>
          {interview && (
            <button
              onClick={async () => {
                if (!user) return;
                const { error } = await supabase
                  .from("employer_candidate_pipeline")
                  .upsert(
                    { employer_id: user.id, session_id: session.id, status: "interview_sent", updated_at: new Date().toISOString() },
                    { onConflict: "employer_id,session_id" }
                  );
                if (error) { toast.error(error.message); return; }
                setPipelineStatus("interview_sent");
                setCompleteOpen(true);
              }}
              style={{
                background: T.white, color: T.text, border: `1.5px solid ${T.text}`,
                padding: "10px 20px", borderRadius: 99, fontSize: 14,
                fontWeight: 500, cursor: "pointer", fontFamily: T.sans,
              }}
            >
              Mark as interviewed
            </button>
          )}
          <button
            onClick={async () => {
              if (!user) return;
              const next = pipelineStatus === "rejected" ? "new" : "rejected";
              const { error } = await supabase
                .from("employer_candidate_pipeline")
                .upsert(
                  { employer_id: user.id, session_id: session.id, status: next, updated_at: new Date().toISOString() },
                  { onConflict: "employer_id,session_id" }
                );
              if (error) { toast.error(error.message); return; }
              setPipelineStatus(next);
              toast.success(next === "rejected" ? "Marked as not interested" : "Status reset");
            }}
            style={{
              background: "transparent", border: "none",
              color: T.dim, fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: T.sans,
              padding: "10px 16px",
            }}
          >
            ✕ Not Interested
          </button>
        </div>
      </div>

      {user && session && (
        <ScheduleInterviewModal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          candidateName={session.name || "Candidate"}
          candidateEmail={session.email || ""}
          sessionId={session.id}
          employerId={user.id}
          existing={interview}
          onSaved={fetchInterview}
        />
      )}
      {interview && (
        <CompleteInterviewModal
          open={completeOpen}
          onClose={() => setCompleteOpen(false)}
          interviewId={interview.id}
          onSaved={fetchInterview}
        />
      )}
    </DashboardLayout>
  );
}

/* ============================== Bits ================================= */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11, fontWeight: 600, color: T.dim,
        letterSpacing: "0.08em", textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: "100%", height: 8, background: T.border, borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: T.green, transition: "width 300ms ease" }} />
    </div>
  );
}

function RubricGrid({
  rubric,
  scores,
}: {
  rubric: { key: string; label: string }[];
  scores: Record<string, number> | undefined;
}) {
  return (
    <div>
      <Label>Rubric breakdown</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {rubric.map((r) => {
          const v = Number(scores?.[r.key] ?? 0);
          return (
            <div key={r.key} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: T.dim, marginBottom: 6 }}>{r.label}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                  {v}<span style={{ fontSize: 12, color: T.dimmer, fontWeight: 500 }}>/2</span>
                </div>
              </div>
              <ScoreBar value={v} max={2} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Feedback({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 20, padding: 16, background: T.off,
        border: `1px solid ${T.border}`, borderRadius: 12,
        fontSize: 14, color: T.dim, lineHeight: 1.6,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        AI feedback
      </div>
      {text}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, color: T.dimmer, fontStyle: "italic" }}>{children}</div>;
}

function ContactChip({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "transparent", border: "none", padding: 0,
        color: T.dim, fontSize: 14, cursor: "pointer", fontFamily: T.sans,
      }}
      title="Click to copy"
    >
      {icon} <span style={{ borderBottom: "1px dotted currentColor" }}>{label}</span>
    </button>
  );
}
