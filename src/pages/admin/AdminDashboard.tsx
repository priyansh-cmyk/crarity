import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { roleLabel } from "@/lib/role-labels";

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

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  role_type: string;
  status: string;
  total_score: number;
  completed: boolean;
  current_step: string;
  scores: Record<string, unknown>;
  created_at: string;
};

type Trend = { label: string; tone: "up" | "down" | "flat" };

function StatCard({ value, label, trend }: { value: string; label: string; trend: Trend }) {
  const color = trend.tone === "up" ? T.green : trend.tone === "down" ? T.red : T.dim;
  const Icon = trend.tone === "up" ? ArrowUp : trend.tone === "down" ? ArrowDown : Minus;
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 32,
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 700, color: T.text, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 14, color: T.dim, marginTop: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 16, fontSize: 12, color, fontWeight: 500 }}>
        <Icon size={12} />
        {trend.label}
      </div>
    </div>
  );
}

const STEP_INDEX: Record<string, number> = {
  "game-1": 0, "game-2": 1, "game-3": 2, "game-4": 3, "results": 4, "completed": 4,
};

export default function AdminDashboard() {
  const [rows, setRows] = useState<Session[]>([]);
  const [employerCount, setEmployerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, r] = await Promise.all([
        supabase
          .from("assessment_sessions")
          .select("id,name,email,role_type,status,total_score,completed,current_step,scores,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("roles").select("user_id"),
      ]);
      if (cancelled) return;
      setRows((s.data ?? []) as Session[]);
      const emps = new Set<string>();
      (r.data ?? []).forEach((x: { user_id: string }) => emps.add(x.user_id));
      setEmployerCount(emps.size);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.completed).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const scoredRows = rows.filter((r) => r.completed && r.total_score > 0);
    const avg = scoredRows.length
      ? Math.round(scoredRows.reduce((a, b) => a + b.total_score, 0) / scoredRows.length)
      : 0;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;

    return { total, completionRate, avg, newThisWeek };
  }, [rows]);

  const funnel = useMemo(() => {
    const started = rows.length;
    const reach = (i: number) => rows.filter((r) => (STEP_INDEX[r.current_step] ?? 0) >= i || r.completed).length;
    const g1 = reach(1);
    const g2 = reach(2);
    const g3 = reach(3);
    const g4 = reach(4);
    const completed = rows.filter((r) => r.completed).length;
    return [
      { label: "Started", count: started },
      { label: "Game 1", count: g1 },
      { label: "Game 2", count: g2 },
      { label: "Game 3", count: g3 },
      { label: "Game 4", count: g4 },
      { label: "Completed", count: completed },
    ];
  }, [rows]);

  const recent = rows.slice(0, 10);
  const maxFunnel = Math.max(funnel[0].count, 1);

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: T.text, marginBottom: 40 }}>Dashboard</h1>

        {/* Stats */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <StatCard
            value={loading ? "—" : String(stats.total)}
            label="Total Candidates"
            trend={{ label: `+${stats.newThisWeek} this week`, tone: stats.newThisWeek > 0 ? "up" : "flat" }}
          />
          <StatCard
            value={loading ? "—" : `${stats.completionRate}%`}
            label="Completion Rate"
            trend={{ label: "vs all-time", tone: "flat" }}
          />
          <StatCard
            value={loading ? "—" : `${stats.avg}/100`}
            label="Average Score"
            trend={{ label: "Across completed", tone: "flat" }}
          />
          <StatCard
            value={loading ? "—" : String(employerCount)}
            label="Active Employers"
            trend={{ label: "With roles posted", tone: employerCount > 0 ? "up" : "flat" }}
          />
        </div>

        {/* Funnel */}
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Assessment Funnel</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {funnel.map((f, i) => {
              const pct = Math.round((f.count / maxFunnel) * 100);
              const prev = i > 0 ? funnel[i - 1].count : f.count;
              const drop = prev > 0 ? Math.round(((prev - f.count) / prev) * 1000) / 10 : 0;
              const isEdge = i === 0 || i === funnel.length - 1;
              return (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 100, fontSize: 14, color: T.text }}>{f.label}</div>
                  <div style={{ flex: 1, background: T.bg, borderRadius: 8, height: 44, position: "relative" }}>
                    <div
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        background: isEdge ? T.green : `${T.green}cc`,
                        height: "100%",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 16,
                        color: T.text,
                        fontSize: 18,
                        fontWeight: 700,
                        transition: "width 400ms",
                      }}
                    >
                      {f.count}
                    </div>
                  </div>
                  <div style={{ width: 90, fontSize: 12, color: i > 0 && drop > 10 ? T.red : T.dim, fontWeight: 500 }}>
                    {i > 0 ? `${drop > 0 ? "-" : ""}${drop}%` : "100%"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent submissions */}
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>Recent Submissions</h2>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr>
                    {["Name", "Email", "Score", "Status", "Submitted", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: 16,
                          borderBottom: `1px solid ${T.border}`,
                          fontSize: 12,
                          fontWeight: 500,
                          color: T.dim,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} style={{ padding: 24, color: T.dim, fontSize: 14, textAlign: "center" }}>
                        No submissions yet.
                      </td>
                    </tr>
                  )}
                  {recent.map((r) => (
                    <tr
                      key={r.id}
                      style={{ transition: "background 150ms" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: 16, borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.text }}>
                        {r.name || "—"}
                      </td>
                      <td style={{ padding: 16, borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.text }}>
                        {r.email || "—"}
                      </td>
                      <td style={{ padding: 16, borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.text, fontWeight: 600 }}>
                        {r.total_score || 0}
                      </td>
                      <td style={{ padding: 16, borderBottom: `1px solid ${T.border}` }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 99,
                            background: r.completed ? T.green : "#e5e5e5",
                            color: T.text,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {r.completed ? "Completed" : "In Progress"}
                        </span>
                      </td>
                      <td style={{ padding: 16, borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.dim }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 16, borderBottom: `1px solid ${T.border}` }}>
                        <Link
                          to={`/admin/candidate/${r.id}`}
                          style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            borderRadius: 99,
                            border: `1px solid ${T.text}`,
                            background: T.white,
                            color: T.text,
                            fontSize: 12,
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Link
              to="/admin/candidates"
              style={{ fontSize: 14, fontWeight: 500, color: T.text, textDecoration: "none", borderBottom: `1px solid transparent` }}
              onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = T.text)}
              onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
            >
              View All Candidates →
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
