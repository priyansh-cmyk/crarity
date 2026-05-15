import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X as XIcon, ShieldCheck, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { gamesForRole, roleLabel } from "@/lib/role-labels";
import type { TelemetryShape } from "@/components/TelemetryPanel";
import type { Telemetry } from "@/hooks/useAssessmentTelemetry";
import { computeRisk, RISK_TIER_META } from "@/lib/anti-cheat";
import { toast } from "sonner";

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  role_type: string;
  status: string;
  total_score: number;
  completed: boolean;
  admin_approved: boolean;
  scores: Record<string, Record<string, unknown>>;
  telemetry: TelemetryShape | null;
  created_at: string;
  updated_at: string;
  willing_to_relocate: boolean | null;
  relocation_timeline: string | null;
  prior_experience: boolean | null;
  prior_experience_duration: string | null;
  weekend_availability: boolean | null;
  start_timeline: string | null;
};

// Game 2 questions — mirrors AcademicCounselorGame2.tsx QUESTIONS array
const GAME2_QUESTIONS = [
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

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  bg: "#f7f6f3",
  red: "#ef4444",
  white: "#ffffff",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type TabKey = "overview" | "details" | "flags";

function fmt(t: string) {
  return new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function gameScore(d: Record<string, unknown> | undefined): number {
  if (!d) return 0;
  return Number((d.total_score as number) ?? (d.score as number) ?? 0) || 0;
}

export default function AdminCandidateDetail() {
  const { id } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const { data, error: err } = await supabase.from("assessment_sessions").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (err || !data) setError(err?.message ?? "Not found");
      else setSession(data as Session);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const games = useMemo(() => (session ? gamesForRole(session.role_type) : []), [session]);
  const maxTotal = games.reduce((s, g) => s + g.maxScore, 0) || 100;

  const updateStatus = async (status: string) => {
    if (!session) return;
    setSaving(true);
    const { error: err } = await supabase.from("assessment_sessions").update({ status }).eq("id", session.id);
    setSaving(false);
    if (!err) setSession({ ...session, status });
  };

  const sendToEmployer = async () => {
    if (!session) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("assessment_sessions")
      .update({ admin_approved: true })
      .eq("id", session.id);
    setSaving(false);
    if (err) {
      toast.error(`Failed: ${err.message}`);
    } else {
      setSession({ ...session, admin_approved: true });
      toast.success(`${session.name ?? "Candidate"} approved — now visible to employers`);
      // Notify candidate by email (best-effort — don't block UI)
      supabase.functions.invoke("notify-approved", {
        body: {
          session_id: session.id,
          candidate_email: session.email,
          candidate_name: session.name,
        },
      }).catch(() => {});
    }
  };

  if (loading) return <AdminLayout><div style={{ color: T.dim, fontFamily: T.sans }}>Loading…</div></AdminLayout>;
  if (error || !session)
    return (
      <AdminLayout>
        <Link to="/admin/candidates" style={{ color: T.text, textDecoration: "none", fontFamily: T.sans }}>← Back</Link>
        <div style={{ marginTop: 24, color: T.red, fontFamily: T.sans }}>{error ?? "Not found"}</div>
      </AdminLayout>
    );

  const contactBits = [session.email, session.phone, session.city].filter(Boolean) as string[];

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, maxWidth: 1400, margin: "0 auto" }}>
        <Link to="/admin/candidates" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.dim, textDecoration: "none", fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to Candidates
        </Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: T.text, marginBottom: 8 }}>{session.name ?? "Unnamed candidate"}</h1>
            <div style={{ fontSize: 14, color: T.dim }}>{contactBits.join(" | ") || "—"}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {session.admin_approved && (
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, fontFamily: T.sans }}>✓ Approved</span>
            )}
            <ActionPill label="Reject" variant="outline" onClick={() => updateStatus("rejected")} disabled={saving} />
            <ActionPill
              label={session.admin_approved ? "Sent to Employers" : "Send to Employer"}
              variant="dark"
              onClick={sendToEmployer}
              disabled={saving || session.admin_approved}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 40, borderBottom: `1px solid ${T.border}`, display: "flex", gap: 32 }}>
          {([
            { k: "overview", l: "Overview" },
            { k: "details", l: "Assessment Details" },
            { k: "flags", l: "Flags" },
          ] as { k: TabKey; l: string }[]).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                background: "transparent",
                border: "none",
                padding: "12px 0",
                fontSize: 15,
                fontWeight: tab === t.k ? 600 : 500,
                color: tab === t.k ? T.text : T.dim,
                borderBottom: `3px solid ${tab === t.k ? T.green : "transparent"}`,
                marginBottom: -1,
                cursor: "pointer",
                fontFamily: T.sans,
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          {tab === "overview" && <OverviewTab session={session} games={games} maxTotal={maxTotal} />}
          {tab === "details" && <DetailsTab session={session} games={games} />}
          {tab === "flags" && <FlagsTab telemetry={session.telemetry as Telemetry | null} scores={session.scores} />}
        </div>
      </div>
    </AdminLayout>
  );
}

function ActionPill({
  label, variant, onClick, disabled,
}: { label: string; variant: "green" | "outline" | "dark"; onClick: () => void; disabled?: boolean }) {
  const styles: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 99,
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: T.sans,
    border: variant === "outline" ? `1px solid ${T.text}` : "none",
    background: variant === "green" ? T.green : variant === "dark" ? T.text : T.white,
    color: variant === "dark" ? T.white : T.text,
    opacity: disabled ? 0.6 : 1,
  };
  return <button style={styles} onClick={onClick} disabled={disabled}>{label}</button>;
}

const card: React.CSSProperties = {
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 24,
};
const cardLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: T.dim,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 16,
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{value ?? "—"}</div>
    </div>
  );
}

function OverviewTab({
  session, games, maxTotal,
}: { session: Session; games: ReturnType<typeof gamesForRole>; maxTotal: number }) {
  const yn = (v: boolean | null) => (v === null || v === undefined ? "—" : v ? "Yes" : "No");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={card}>
        <div style={cardLabel}>Personal Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          <InfoRow label="Name" value={session.name} />
          <InfoRow label="Email" value={session.email} />
          <InfoRow label="Phone" value={session.phone} />
          <InfoRow label="City" value={session.city} />
          <InfoRow label="Willing to relocate" value={yn(session.willing_to_relocate)} />
          <InfoRow label="Relocation timeline" value={session.relocation_timeline} />
          <InfoRow label="Prior experience" value={session.prior_experience === null ? "—" : session.prior_experience ? `Yes${session.prior_experience_duration ? `, ${session.prior_experience_duration}` : ""}` : "No"} />
          <InfoRow label="Weekend availability" value={yn(session.weekend_availability)} />
          <InfoRow label="Start timeline" value={session.start_timeline} />
        </div>
      </div>

      <div style={{ ...card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 64, fontWeight: 700, color: T.text, lineHeight: 1 }}>
          {session.total_score}<span style={{ fontSize: 32, color: T.dim }}>/{maxTotal}</span>
        </div>
        <div style={{ fontSize: 14, color: T.dim, marginTop: 12 }}>Overall Assessment Score</div>
      </div>

      <div>
        <div style={{ ...cardLabel, marginBottom: 16 }}>Game Scores</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {games.map((g) => {
            const s = gameScore(session.scores[g.key]);
            const pct = Math.min(100, (s / g.maxScore) * 100);
            return (
              <div key={g.key} style={card}>
                <div style={{ fontSize: 32, fontWeight: 700, color: T.text }}>
                  {s}<span style={{ fontSize: 18, color: T.dim }}>/{g.maxScore}</span>
                </div>
                <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>{g.title}</div>
                <div style={{ marginTop: 12, height: 6, background: T.bg, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: T.green, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card}>
        <div style={cardLabel}>Assessment Timeline</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TimelineRow label="Started" value={fmt(session.created_at)} />
          <TimelineRow label="Last updated" value={fmt(session.updated_at)} />
          <TimelineRow label="Status" value={session.completed ? "Completed" : "In progress"} />
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: 99, background: T.green }} />
      <div style={{ fontSize: 14, color: T.text, fontWeight: 500, minWidth: 140 }}>{label}</div>
      <div style={{ fontSize: 14, color: T.dim }}>{value}</div>
    </div>
  );
}

function DetailsTab({ session, games }: { session: Session; games: ReturnType<typeof gamesForRole> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {games.map((g) => {
        const data = session.scores[g.key];
        const s = gameScore(data);
        return (
          <div key={g.key}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>{g.title}</h2>
            <div style={{ fontSize: 13, color: T.dim, marginBottom: 16 }}>Score: <strong style={{ color: T.text }}>{s}/{g.maxScore}</strong></div>
            <div style={card}>
              {!data ? (
                <div style={{ fontSize: 14, color: T.dim }}>Not attempted.</div>
              ) : g.type === "selection" ? (
                <SelectionDetail data={data} />
              ) : g.type === "mcq" ? (
                <McqDetail data={data} />
              ) : g.type === "voice" ? (
                <VoiceDetail data={data} />
              ) : (
                <TextDetail data={data} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SelectionDetail({ data }: { data: Record<string, unknown> }) {
  const selected = (data.selected as string[]) ?? [];
  const correct = (data.correct as string[]) ?? [];
  return (
    <div>
      <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>Selected leads</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: T.text, lineHeight: 1.8 }}>
        {selected.length === 0 && <li style={{ color: T.dim, listStyle: "none", paddingLeft: 0 }}>None</li>}
        {selected.map((s) => (
          <li key={s} style={{ display: "flex", alignItems: "center", gap: 8, listStyle: "none", marginLeft: -20 }}>
            {correct.includes(s) ? <Check size={14} color="#16a34a" /> : <XIcon size={14} color={T.red} />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function McqDetail({ data }: { data: Record<string, unknown> }) {
  // Game 2 saves answers as number[] (selected option indices), e.g. [1, 0, 3, null, 1]
  const rawAnswers = data.answers as Array<number | null> | null;
  if (!rawAnswers || rawAnswers.length === 0) {
    return <div style={{ fontSize: 14, color: T.dim }}>No answers recorded.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rawAnswers.map((selectedIdx, i) => {
        const q = GAME2_QUESTIONS[i];
        if (!q) return null;
        const isCorrect = selectedIdx === q.correct;
        const selectedText = selectedIdx !== null && selectedIdx !== undefined ? q.options[selectedIdx] : null;
        return (
          <div key={i} style={{ padding: 14, background: T.bg, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: T.dim, marginBottom: 6 }}>Question {i + 1}</div>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>{q.q}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map((opt, idx) => {
                const isSelected = idx === selectedIdx;
                const isCorrectOpt = idx === q.correct;
                let bg = "transparent";
                let color = T.dim;
                let borderColor = "transparent";
                if (isSelected && isCorrect) { bg = "#f0fdf4"; color = "#16a34a"; borderColor = "#16a34a"; }
                else if (isSelected && !isCorrect) { bg = "#fef2f2"; color = T.red; borderColor = T.red; }
                else if (isCorrectOpt) { bg = "#f0fdf4"; color = "#16a34a"; borderColor = "#16a34a"; }
                return (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                    borderRadius: 6, border: `1px solid ${borderColor}`, background: bg,
                    fontSize: 13, color,
                  }}>
                    {isSelected ? (isCorrect ? <Check size={14} color="#16a34a" /> : <XIcon size={14} color={T.red} />) : <span style={{ width: 14 }} />}
                    {opt}
                    {isSelected && !isCorrect && isCorrectOpt && <span style={{ marginLeft: "auto", fontSize: 11 }}>← correct</span>}
                    {!isSelected && isCorrectOpt && <span style={{ marginLeft: "auto", fontSize: 11 }}>← correct</span>}
                  </div>
                );
              })}
            </div>
            {selectedText === null && (
              <div style={{ fontSize: 12, color: T.dim, marginTop: 8 }}>Not answered</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VoiceDetail({ data }: { data: Record<string, unknown> }) {
  const recordings = (data.recordings as Array<{ label?: string; url?: string; duration?: number; type?: string; created_at?: string }>) ?? [];
  const audioUrl = (data.audio_url || data.pitch_recording_url) as string | undefined;
  const objectionUrl = (data.objection2_recording_url) as string | undefined;
  const transcript = data.transcript as string | undefined;
  const feedback = data.feedback as string | undefined;

  // Build items: prefer explicit recordings array, else construct from known fields
  const items: Array<{ label: string; url: string; duration?: number; type?: string }> =
    recordings.length > 0
      ? recordings.map((r, i) => ({ label: r.label ?? `Recording ${i + 1}`, url: r.url ?? "", duration: r.duration, type: r.type }))
      : [
          audioUrl ? { label: "Pitch recording", url: audioUrl, duration: data.audio_duration as number | undefined } : null,
          objectionUrl ? { label: "Objection handling recording", url: objectionUrl, duration: data.objection2_duration as number | undefined } : null,
        ].filter(Boolean) as Array<{ label: string; url: string; duration?: number }>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {items.length === 0 && <div style={{ fontSize: 14, color: T.dim }}>No recordings.</div>}
      {items.map((r, i) => (
        <div key={i}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>{r.label ?? `Recording ${i + 1}`}</div>
          {r.type === "video" ? (
            <video controls src={r.url} style={{ width: "100%", maxWidth: 480, borderRadius: 8 }} />
          ) : (
            <audio controls src={r.url} style={{ width: "100%" }} />
          )}
          <div style={{ fontSize: 12, color: T.dim, marginTop: 6 }}>
            {r.duration ? `Duration: ${r.duration}s` : ""}{r.created_at ? ` • ${fmt(r.created_at)}` : ""}
          </div>
        </div>
      ))}
      {transcript && (
        <div>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 6 }}>Transcript</div>
          <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 14, lineHeight: 1.6, color: T.text, whiteSpace: "pre-wrap" }}>{transcript}</div>
        </div>
      )}
      {feedback && (
        <div>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 6 }}>Evaluation notes</div>
          <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>{feedback}</div>
        </div>
      )}
    </div>
  );
}

function TextDetail({ data }: { data: Record<string, unknown> }) {
  const turn1 = (data.turn1_response as string) || (data.refund_turn1_response as string) || (data.turn1 as string) || "";
  const turn2 = (data.turn2_response as string) || (data.refund_turn2_response as string) || (data.turn2 as string) || "";
  const single = (data.response_text as string) ?? (data.answer as string) ?? "";
  const feedback = data.feedback as string | undefined;
  const turns = (turn1 || turn2) ? [turn1, turn2].filter(Boolean) : single ? [single] : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {turns.length === 0 && <div style={{ fontSize: 14, color: T.dim }}>No response recorded.</div>}
      {turns.map((t, i) => (
        <div key={i}>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 6 }}>Turn {i + 1} response</div>
          <div style={{ padding: 16, background: T.bg, borderRadius: 8, fontSize: 14, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap" }}>{t}</div>
        </div>
      ))}
      {feedback && (
        <div>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 6 }}>Evaluation notes</div>
          <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>{feedback}</div>
        </div>
      )}
    </div>
  );
}

function FlagsTab({ telemetry, scores }: { telemetry: Telemetry | null; scores: Record<string, Record<string, unknown>> }) {
  const risk = computeRisk(telemetry, scores);
  const meta = RISK_TIER_META[risk.tier];
  const tabs = telemetry?.tab_switches ?? [];
  const pastes = telemetry?.paste_events ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Anti-Cheating Report header */}
      <div style={{ ...card, borderColor: meta.border, background: meta.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: meta.fg, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Anti-Cheating Report
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: meta.fg, marginTop: 8 }}>
              {risk.score}<span style={{ fontSize: 18, opacity: 0.6 }}>/100</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: meta.fg, marginTop: 4 }}>{meta.label}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={cheatBtn(false)}>Flag for Manual Review</button>
            <button style={cheatBtn(true)}>Disqualify</button>
          </div>
        </div>
      </div>

      {/* Flags list */}
      {risk.flags.length === 0 ? (
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 12, borderColor: "#16a34a", background: "#f0fdf4" }}>
          <ShieldCheck size={20} color="#16a34a" />
          <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>No suspicious activity detected</div>
        </div>
      ) : (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
            Flags Detected
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {risk.flags.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: T.text }}>
                <AlertTriangle size={16} color={T.red} /> {f.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab switch timestamps */}
      {tabs.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Tab switch log
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tabs.map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: T.text }}>
                <strong>{t.game}</strong> — away from {new Date(t.blur_at).toLocaleTimeString()} for {t.duration_seconds}s
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paste contents */}
      {pastes.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Pasted content (preview)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pastes.map((p, i) => (
              <div key={i} style={{ background: T.bg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>{p.field} · {new Date(p.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: 13, color: T.text, whiteSpace: "pre-wrap" }}>
                  {(p as { content_preview?: string }).content_preview || <em style={{ color: T.dim }}>(content not stored)</em>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {telemetry?.ip_address && (
        <div style={{ fontSize: 12, color: T.dim }}>IP address: {telemetry.ip_address}</div>
      )}
    </div>
  );
}

function cheatBtn(solid: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 99,
    border: solid ? "none" : `1px solid ${T.text}`,
    background: solid ? T.text : T.white,
    color: solid ? T.white : T.text,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: T.sans,
    cursor: "pointer",
  };
}
