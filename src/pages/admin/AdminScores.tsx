import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  bg: "#f7f6f3",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const GAMES = [
  { key: "game1", label: "Pick Your Shot", max: 25 },
  { key: "game2", label: "Say It Like You Mean It", max: 25 },
  { key: "game3", label: "Beyond The Student", max: 25 },
  { key: "game4", label: "Handle the Heat", max: 25 },
] as const;

// Mirrors AcademicCounselorGame2.tsx QUESTIONS — used to decode numeric answer indices
const GAME2_OPTIONS = [
  ["4 sessions", "8 sessions", "12 sessions", "16 sessions"],
  ["Yes, the program covers Class 7", "No, this program is only for Class 11-12", "Yes, but they should start with the foundation batch first", "No, the child needs to be in Class 10 minimum"],
  ["Same day (January 15th)", "Next Monday", "Within 3 days", "After the batch start date mentioned in the brochure"],
  ["₹5,000/month", "₹6,000/month", "₹7,000/month", "₹8,000/month"],
  ["Yes, within 7 days", "Yes, within 15 days", "Yes, anytime during the course", "No, plan changes not allowed after enrollment"],
];
const GAME2_CORRECT = [1, 1, 3, 1, 1];

type GameKey = typeof GAMES[number]["key"];

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
  scores: any;
  total_score: number;
};

type ReviewMeta = {
  status?: "pending" | "reviewed" | "flagged";
  manual_scores?: Partial<Record<GameKey, number>>;
  notes?: Partial<Record<GameKey, string>>;
  reviewed_at?: string;
  source?: "ai" | "manual";
};

const aiScore = (s: Session, key: GameKey): number => {
  const g = s.scores?.[key];
  const v = g?.total_score;
  return Number.isFinite(Number(v)) ? Number(v) : 0;
};
const aiReason = (s: Session, key: GameKey): string => {
  const g = s.scores?.[key];
  return g?.ai_reasoning || g?.reasoning || g?.feedback || defaultReason(s, key);
};
const defaultReason = (s: Session, key: GameKey): string => {
  const g = s.scores?.[key] || {};
  if (key === "game1") return "Lead prioritization assessed against urgency, intent, and appointment signals.";
  if (key === "game2") return `Multiple-choice course knowledge check. ${g.answers ? `${g.answers.length} answers submitted.` : ""}`;
  if (key === "game3") return "Voice pitch scored on rubric: opening, price handling, urgency, CTA, tone.";
  return "Refund/objection response scored for empathy, policy boundaries, alternatives, and professionalism.";
};
const reviewMeta = (s: Session): ReviewMeta => s.scores?.review || {};
const reviewStatus = (s: Session): "pending" | "reviewed" | "flagged" =>
  reviewMeta(s).status || "pending";
const finalGameScore = (s: Session, key: GameKey): number => {
  const m = reviewMeta(s).manual_scores?.[key];
  return m != null ? m : aiScore(s, key);
};
const finalTotal = (s: Session): number =>
  GAMES.reduce((sum, g) => sum + finalGameScore(s, g.key), 0);
const aiTotal = (s: Session): number =>
  GAMES.reduce((sum, g) => sum + aiScore(s, g.key), 0);

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

type Tab = "pending" | "reviewed" | "all";

export default function AdminScores() {
  const [tab, setTab] = useState<Tab>("pending");
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Session | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id,name,email,phone,city,created_at,scores,total_score")
      .eq("completed", true)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data || []) as Session[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, reviewed: 0, all: rows.length };
    for (const r of rows) {
      const st = reviewStatus(r);
      if (st === "pending") c.pending++;
      else c.reviewed++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    if (tab === "pending") return rows.filter((r) => reviewStatus(r) === "pending");
    return rows.filter((r) => reviewStatus(r) !== "pending");
  }, [rows, tab]);

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, color: T.text }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, marginBottom: 12 }}>Scoring Queue</h1>
        <p style={{ fontSize: 16, color: T.dim, margin: 0, marginBottom: 24 }}>
          Review AI-scored assessments and manually adjust scores before finalizing.
        </p>

        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 32 }}>
          {([
            { k: "pending", label: "Pending Review", count: counts.pending },
            { k: "reviewed", label: "Reviewed", count: counts.reviewed },
            { k: "all", label: "All", count: counts.all },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                padding: "12px 20px",
                background: "none",
                border: "none",
                borderBottom: tab === t.k ? `3px solid ${T.green}` : "3px solid transparent",
                color: tab === t.k ? T.text : T.dim,
                fontWeight: 600, fontSize: 14, cursor: "pointer",
                fontFamily: T.sans, marginBottom: -1,
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: T.dim, padding: 40, textAlign: "center" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 48, textAlign: "center", color: T.dim }}>
            Nothing to show in this view.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {filtered.map((s) => (
              <SessionCard key={s.id} s={s} onOpen={() => setActive(s)} />
            ))}
          </div>
        )}

        {active && (
          <ReviewModal
            session={active}
            onClose={() => setActive(null)}
            onSaved={async () => { await load(); setTab("reviewed"); setActive(null); }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function SessionCard({ s, onOpen }: { s: Session; onOpen: () => void }) {
  const status = reviewStatus(s);
  const meta = reviewMeta(s);
  const showAi = status === "pending";
  const total = showAi ? aiTotal(s) : finalTotal(s);

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{s.name || "—"}</div>
          <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>Submitted {timeAgo(s.created_at)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{total}/100</div>
          <StatusBadge status={status} variant={meta.source} />
        </div>
      </div>

      <div style={{ fontSize: 14, color: T.dim, marginBottom: 16 }}>
        {[s.email, s.phone, s.city].filter(Boolean).join(" | ") || "—"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {GAMES.map((g) => {
          const score = showAi ? aiScore(s, g.key) : finalGameScore(s, g.key);
          return (
            <div key={g.key} style={{ background: T.bg, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>{g.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{score}/{g.max}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onOpen} style={btnDark}>
          {status === "pending" ? "Review & Score" : "Re-review"} <ArrowRight size={16} color={T.green} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status, variant }: { status: "pending" | "reviewed" | "flagged"; variant?: "ai" | "manual" }) {
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    pending: { bg: "#fef3c7", fg: "#92400e", label: "Pending Review" },
    reviewed: { bg: "#dcfce7", fg: "#166534", label: variant === "ai" ? "Reviewed (AI Accepted)" : "Reviewed (Manual)" },
    flagged: { bg: "#fee2e2", fg: "#991b1b", label: "Flagged" },
  };
  const s = styles[status];
  return (
    <span style={{ display: "inline-block", marginTop: 6, background: s.bg, color: s.fg, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function ReviewModal({ session, onClose, onSaved }: { session: Session; onClose: () => void; onSaved: () => Promise<void> }) {
  const initial = reviewMeta(session);
  const [scores, setScores] = useState<Record<GameKey, number>>(() => ({
    game1: initial.manual_scores?.game1 ?? aiScore(session, "game1"),
    game2: initial.manual_scores?.game2 ?? aiScore(session, "game2"),
    game3: initial.manual_scores?.game3 ?? aiScore(session, "game3"),
    game4: initial.manual_scores?.game4 ?? aiScore(session, "game4"),
  }));
  const [notes, setNotes] = useState<Record<GameKey, string>>(() => ({
    game1: initial.notes?.game1 ?? "",
    game2: initial.notes?.game2 ?? "",
    game3: initial.notes?.game3 ?? "",
    game4: initial.notes?.game4 ?? "",
  }));
  const [saving, setSaving] = useState(false);

  const aiTot = aiTotal(session);
  const yourTot = GAMES.reduce((s, g) => s + (scores[g.key] || 0), 0);
  const diff = yourTot - aiTot;

  const setScore = (k: GameKey, v: number, max: number) =>
    setScores((p) => ({ ...p, [k]: Math.max(0, Math.min(max, Math.round(Number(v) || 0))) }));

  const persist = async (action: "accept" | "manual" | "flag") => {
    setSaving(true);
    const review: ReviewMeta = {
      status: action === "flag" ? "flagged" : "reviewed",
      reviewed_at: new Date().toISOString(),
      source: action === "manual" ? "manual" : "ai",
      manual_scores: action === "manual" ? scores : undefined,
      notes: action === "manual" ? notes : undefined,
    };
    const newScores = { ...(session.scores || {}), review };
    const newTotal = action === "manual" ? yourTot : aiTot;
    const { error } = await supabase
      .from("assessment_sessions")
      .update({ scores: newScores, total_score: newTotal })
      .eq("id", session.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Scoring saved for ${session.name || "candidate"}`);
    await onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, overflow: "auto", padding: "0", fontFamily: T.sans }}>
      <div style={{ background: "#fff", maxWidth: 1200, margin: "32px auto 0", borderRadius: 16, position: "relative", paddingBottom: 96 }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "24px 32px", borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 2 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", color: T.text }}><X size={22} /></button>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{session.name || "Candidate"}</h2>
          <div style={{ marginTop: 8, fontSize: 14, color: T.dim }}>
            {[session.email, session.phone, session.city].filter(Boolean).join(" | ")}
          </div>
          <div style={{ marginTop: 12, fontSize: 16 }}>
            AI Total Score: <strong>{aiTot}/100</strong>
          </div>
        </div>

        {/* Per-game review */}
        <div style={{ padding: 32, display: "grid", gap: 24 }}>
          {GAMES.map((g) => (
            <GameReview
              key={g.key}
              gameKey={g.key}
              label={g.label}
              max={g.max}
              session={session}
              score={scores[g.key]}
              note={notes[g.key]}
              onScore={(v) => setScore(g.key, v, g.max)}
              onNote={(v) => setNotes((p) => ({ ...p, [g.key]: v }))}
            />
          ))}
        </div>

        {/* Sticky bottom bar */}
        <div style={{
          position: "sticky", bottom: 0, background: "#fff", borderTop: `1px solid ${T.border}`,
          padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: 14 }}>
            <span><span style={{ color: T.dim }}>AI Total:</span> <strong>{aiTot}/100</strong></span>
            <span><span style={{ color: T.dim }}>Your Total:</span> <strong>{yourTot}/100</strong></span>
            <span style={{ color: diff > 0 ? "#166534" : diff < 0 ? "#b91c1c" : T.dim, fontWeight: 600 }}>
              Difference: {diff > 0 ? "+" : ""}{diff} points
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => persist("accept")} disabled={saving} style={btnLight}>Accept AI Scores</button>
            <button onClick={() => persist("manual")} disabled={saving} style={btnDark}>Save My Scores <ArrowRight size={16} color={T.green} /></button>
            <button onClick={() => persist("flag")} disabled={saving} style={btnLight}>Flag for Discussion</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameReview({
  gameKey, label, max, session, score, note, onScore, onNote,
}: {
  gameKey: GameKey; label: string; max: number; session: Session;
  score: number; note: string;
  onScore: (v: number) => void; onNote: (v: string) => void;
}) {
  const ai = aiScore(session, gameKey);
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>{label}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: T.bg, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>AI Scoring</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{ai}/{max}</div>
          <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.6, marginBottom: 12 }}>{aiReason(session, gameKey)}</div>
          <GameEvidence session={session} gameKey={gameKey} />
        </div>
        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Manual Review</div>
          <label style={{ display: "block", fontSize: 12, color: T.dim, marginBottom: 4 }}>Your Score (0–{max})</label>
          <input
            type="number" min={0} max={max} value={score}
            onChange={(e) => onScore(Number(e.target.value))}
            style={{ width: 100, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 16, fontFamily: T.sans, marginBottom: 12 }}
          />
          <input
            type="range" min={0} max={max} value={score}
            onChange={(e) => onScore(Number(e.target.value))}
            style={{ width: "100%", accentColor: T.green, marginBottom: 12 }}
          />
          <label style={{ display: "block", fontSize: 12, color: T.dim, marginBottom: 4 }}>Notes (optional)</label>
          <textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Add your reasoning..."
            rows={3}
            style={{ width: "100%", padding: 10, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.sans, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>
  );
}

function GameEvidence({ session, gameKey }: { session: Session; gameKey: GameKey }) {
  const g = session.scores?.[gameKey] || {};
  if (gameKey === "game1") {
    const picks: string[] = g.selected_leads || g.picks || [];
    return picks.length ? (
      <div style={{ fontSize: 12, color: T.text }}>
        <strong>Picks:</strong> {picks.join(", ")}
      </div>
    ) : null;
  }
  if (gameKey === "game2") {
    const answers: (number | null)[] = g.answers || [];
    if (!answers.length) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {answers.map((a, i) => {
          const opts = GAME2_OPTIONS[i] ?? [];
          const correct = GAME2_CORRECT[i];
          const isCorrect = a === correct;
          const selectedText = a !== null && a !== undefined ? opts[a] : "—";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 18, height: 18, borderRadius: "50%",
                background: a === null ? "#e5e5e5" : isCorrect ? "#dcfce7" : "#fee2e2",
                color: a === null ? T.dim : isCorrect ? "#166534" : "#991b1b",
                fontWeight: 700, flexShrink: 0,
              }}>
                {a === null ? "—" : isCorrect ? "✓" : "✗"}
              </span>
              <span style={{ color: T.dim }}>Q{i + 1}:</span>
              <span style={{ color: T.text }}>{selectedText}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (gameKey === "game3") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {g.audio_url && <audio controls src={g.audio_url} style={{ width: "100%" }} />}
        {g.transcript && (
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, color: T.text, maxHeight: 120, overflow: "auto" }}>
            {g.transcript}
          </div>
        )}
      </div>
    );
  }
  if (gameKey === "game4") {
    const r1 = g.turn1_response || g.response_text || "";
    const r2 = g.turn2_response || "";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {r1 && <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, whiteSpace: "pre-wrap" }}><strong>Turn 1:</strong> {r1}</div>}
        {r2 && <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, whiteSpace: "pre-wrap" }}><strong>Turn 2:</strong> {r2}</div>}
      </div>
    );
  }
  return null;
}

const btnDark: React.CSSProperties = {
  background: T.text, color: "#fff", padding: "10px 20px", borderRadius: 999, border: "none",
  cursor: "pointer", fontFamily: T.sans, fontWeight: 600, fontSize: 13,
  display: "inline-flex", alignItems: "center", gap: 8,
};
const btnLight: React.CSSProperties = {
  background: "#fff", color: T.text, padding: "10px 20px", borderRadius: 999, border: `1px solid ${T.text}`,
  cursor: "pointer", fontFamily: T.sans, fontWeight: 600, fontSize: 13,
};
