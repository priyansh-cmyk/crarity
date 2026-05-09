import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  current_step: string;
  completed: boolean;
  total_score: number;
  scores: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const T = {
  green: "#C5E831",
  greenLight: "#dff08c",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  bg: "#f7f6f3",
  red: "#ef4444",
  white: "#ffffff",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const STEP_INDEX: Record<string, number> = {
  "game-1": 0, "game-2": 1, "game-3": 2, "game-4": 3, "results": 4, "completed": 4,
};

const RANGES: { label: string; days: number | null }[] = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 90 Days", days: 90 },
  { label: "All Time", days: null },
];

function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function highestStage(s: Session): number {
  if (s.completed) return 5;
  return STEP_INDEX[s.current_step] ?? 0;
}

export default function AdminAnalytics() {
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [drillStage, setDrillStage] = useState<number | null>(null); // for drop-off list

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_sessions")
        .select("id,name,email,current_step,completed,total_score,scores,created_at,updated_at")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setRows((data ?? []) as Session[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const days = RANGES[rangeIdx].days;
    if (!days) return rows;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
  }, [rows, rangeIdx]);

  // Funnel: bars 0..5
  const funnel = useMemo(() => {
    const total = filtered.length;
    const stages = [0, 1, 2, 3, 4, 5].map((stage) => filtered.filter((r) => highestStage(r) >= stage).length);
    const labels = ["Started Assessment", "Completed Game 1", "Completed Game 2", "Completed Game 3", "Completed Game 4", "Completed Assessment"];
    return labels.map((label, i) => {
      const count = stages[i];
      const prev = i > 0 ? stages[i - 1] : count;
      const drop = prev - count;
      const dropPct = prev > 0 ? (drop / prev) * 100 : 0;
      const pctOfTotal = total > 0 ? (count / total) * 100 : 0;
      return { label, count, drop, dropPct, pctOfTotal };
    });
  }, [filtered]);

  // Drop-off candidates per stage (1..4) — those whose highestStage === stage exactly (didn't complete next)
  const dropoffs = useMemo(() => {
    return [1, 2, 3, 4].map((stage) => {
      // people who reached stage but not stage+1 — i.e. highestStage === stage
      const list = filtered.filter((r) => highestStage(r) === stage);
      const totalMs = list.reduce((s, r) => s + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()), 0);
      const avg = list.length ? totalMs / list.length : 0;
      return { stage, label: `Dropped After Game ${stage}`, list, avgMs: avg };
    });
  }, [filtered]);

  // Completion rate over time (per day)
  const trend = useMemo(() => {
    const buckets: Record<string, { started: number; completed: number }> = {};
    filtered.forEach((r) => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      if (!buckets[d]) buckets[d] = { started: 0, completed: 0 };
      buckets[d].started += 1;
      if (r.completed) buckets[d].completed += 1;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), rate: v.started ? Math.round((v.completed / v.started) * 100) : 0 }));
  }, [filtered]);

  // Score distribution
  const distribution = useMemo(() => {
    const buckets = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];
    filtered.filter((r) => r.completed).forEach((r) => {
      const s = r.total_score;
      const b = buckets.find((b) => s >= b.min && s <= b.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [filtered]);

  // Avg time per game (uses scores[gameN].duration_seconds if available, else falls back)
  const avgTime = useMemo(() => {
    const games = ["game1", "game2", "game3", "game4"];
    return games.map((g, i) => {
      const durations = filtered
        .map((r) => Number((r.scores?.[g] as { duration_seconds?: number })?.duration_seconds ?? 0))
        .filter((n) => n > 0);
      const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      return { game: `Game ${i + 1}`, minutes: Math.round((avg / 60) * 10) / 10 };
    });
  }, [filtered]);

  const totalStarted = funnel[0]?.count ?? 0;

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: T.text }}>Analytics</h1>
          <select
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
            style={{
              padding: "10px 16px", borderRadius: 99, border: `1px solid ${T.text}`,
              background: T.white, color: T.text, fontSize: 14, fontFamily: T.sans, cursor: "pointer", outline: "none",
            }}
          >
            {RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
          </select>
        </div>

        {/* Funnel */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Candidate Journey Funnel</h2>
          {loading ? (
            <div style={{ color: T.dim, fontSize: 14 }}>Loading…</div>
          ) : totalStarted === 0 ? (
            <div style={{ color: T.dim, fontSize: 14 }}>No data in this range.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {funnel.map((b, i) => {
                const widthPct = totalStarted ? (b.count / totalStarted) * 100 : 0;
                const isEdge = i === 0 || i === funnel.length - 1;
                const fill = isEdge ? T.green : T.greenLight;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 200, fontSize: 14, color: T.text, fontWeight: 500 }}>{b.label}</div>
                    <div style={{ flex: 1, background: T.bg, borderRadius: 8, height: 56, position: "relative" }}>
                      <div
                        style={{
                          width: `${Math.max(widthPct, 4)}%`, background: fill, height: "100%", borderRadius: 8,
                          display: "flex", alignItems: "center", paddingLeft: 16, gap: 12,
                          transition: "width 400ms ease",
                        }}
                      >
                        <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{b.count}</span>
                        <span style={{ fontSize: 12, color: T.text, opacity: 0.7 }}>{Math.round(b.pctOfTotal)}%</span>
                      </div>
                    </div>
                    <div style={{ width: 120, fontSize: 13, color: i > 0 && b.dropPct > 10 ? T.red : T.dim, fontWeight: 500 }}>
                      {i === 0 ? "" : `-${b.drop} (${b.dropPct.toFixed(1)}%)`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Drop-off cards */}
        <section style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Drop-off Detail</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {dropoffs.map((d) => (
              <div key={d.stage} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{d.list.length} candidates</div>
                <div style={{ fontSize: 14, color: T.dim, marginTop: 4 }}>{d.label}</div>
                <div style={{ fontSize: 12, color: T.dim, marginTop: 12 }}>Avg time before drop: <strong style={{ color: T.text }}>{fmtDuration(d.avgMs)}</strong></div>
                <button
                  onClick={() => setDrillStage(d.stage)}
                  disabled={d.list.length === 0}
                  style={{
                    marginTop: 16, padding: "8px 14px", borderRadius: 99,
                    border: `1px solid ${T.text}`, background: T.white, color: T.text,
                    fontSize: 12, fontWeight: 500, cursor: d.list.length === 0 ? "not-allowed" : "pointer",
                    opacity: d.list.length === 0 ? 0.4 : 1, fontFamily: T.sans,
                  }}
                >
                  View List
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Trend */}
        <section style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Completion Rate Over Time</h2>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, height: 320 }}>
            {trend.length === 0 ? (
              <div style={{ color: T.dim, fontSize: 14 }}>No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={T.dim} style={{ fontSize: 12 }} />
                  <YAxis stroke={T.dim} style={{ fontSize: 12 }} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.sans, fontSize: 13 }} />
                  <Line type="monotone" dataKey="rate" stroke={T.green} strokeWidth={3} dot={{ fill: T.green, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Score distribution */}
        <section style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Score Distribution</h2>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke={T.dim} style={{ fontSize: 12 }} />
                <YAxis stroke={T.dim} style={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.sans, fontSize: 13 }} />
                <Bar dataKey="count" fill={T.green} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Avg time per game */}
        <section style={{ marginTop: 60, marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Average Time Per Game</h2>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgTime}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="game" stroke={T.dim} style={{ fontSize: 12 }} />
                <YAxis stroke={T.dim} style={{ fontSize: 12 }} unit=" min" />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.sans, fontSize: 13 }} />
                <Bar dataKey="minutes" fill={T.green} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Drill-down modal */}
        {drillStage !== null && (
          <DropoffModal
            stage={drillStage}
            list={dropoffs.find((d) => d.stage === drillStage)?.list ?? []}
            onClose={() => setDrillStage(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function DropoffModal({ stage, list, onClose }: { stage: number; list: Session[]; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white, borderRadius: 16, maxWidth: 900, width: "100%",
          maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
          fontFamily: T.sans,
        }}
      >
        <div style={{ padding: 24, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Dropped After Game {stage}</div>
            <div style={{ fontSize: 13, color: T.dim, marginTop: 2 }}>{list.length} candidate{list.length === 1 ? "" : "s"}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.dim }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Email", "Time Spent", "Last Activity", "Re-engage"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 16, fontSize: 12, fontWeight: 500, color: T.dim, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.white }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: T.dim, fontSize: 14 }}>No drop-offs.</td></tr>
              )}
              {list.map((r) => {
                const spent = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
                return (
                  <tr key={r.id}>
                    <td style={td}>{r.name ?? "—"}</td>
                    <td style={td}>{r.email ?? "—"}</td>
                    <td style={td}>{fmtDuration(spent)}</td>
                    <td style={td}>{new Date(r.updated_at).toLocaleString()}</td>
                    <td style={td}>
                      <button
                        onClick={() => alert(`Re-engagement email queued to ${r.email}`)}
                        disabled={!r.email}
                        style={{
                          padding: "6px 14px", borderRadius: 99, background: T.text, color: T.white,
                          fontSize: 12, fontWeight: 500, border: "none", cursor: r.email ? "pointer" : "not-allowed",
                          opacity: r.email ? 1 : 0.4, fontFamily: T.sans,
                        }}
                      >
                        Re-engage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const td: React.CSSProperties = {
  padding: 16, borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.text,
};
