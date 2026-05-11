import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";

const T = {
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  bg: "#f7f6f3",
  green: "#C5E831",
  red: "#ff4d4f",
  yellow: "#faad14",
};

interface Stats {
  totalCompleted: number;
  pendingAdminReview: number;
  adminApproved: number;
  last24h: number;
  abandoned: number; // incomplete + no activity for >2h
  avgScore: number | null;
}

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminHealth() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errLoading, setErrLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadErrors();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const cutoffAbandoned = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const [
      { data: allSessions },
      { data: recent },
      { data: abandoned },
    ] = await Promise.all([
      supabase.from("assessment_sessions").select("completed, scores, total_score, admin_approved, status"),
      supabase.from("assessment_sessions").select("id").gte("created_at", cutoff24h),
      supabase
        .from("assessment_sessions")
        .select("id")
        .eq("completed", false)
        .lt("last_activity_at", cutoffAbandoned),
    ]);

    const sessions = allSessions || [];
    const completed = sessions.filter((s: any) => s.completed);
    const pendingReview = completed.filter((s: any) => {
      const st = s?.scores?.review?.status;
      return !st || st === "pending";
    });
    const approved = completed.filter((s: any) => s.admin_approved === true);

    const scores = completed
      .map((s: any) => s.total_score)
      .filter((v: any) => typeof v === "number" && v > 0);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : null;

    setStats({
      totalCompleted: completed.length,
      pendingAdminReview: pendingReview.length,
      adminApproved: approved.length,
      last24h: (recent || []).length,
      abandoned: (abandoned || []).length,
      avgScore,
    });
    setLoading(false);
  };

  const loadErrors = async () => {
    setErrLoading(true);
    const { data } = await supabase
      .from("error_logs")
      .select("id, error_type, error_message, error_stack, context, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setErrors((data as ErrorLog[]) || []);
    setErrLoading(false);
  };

  const statCards = stats
    ? [
        {
          label: "Completed Assessments",
          value: stats.totalCompleted,
          icon: CheckCircle2,
          color: T.green,
        },
        {
          label: "Pending Admin Review",
          value: stats.pendingAdminReview,
          icon: Clock,
          color: stats.pendingAdminReview > 0 ? T.yellow : T.green,
        },
        {
          label: "Sent to Employers",
          value: stats.adminApproved,
          icon: Users,
          color: T.green,
        },
        {
          label: "New (last 24 h)",
          value: stats.last24h,
          icon: Activity,
          color: T.green,
        },
        {
          label: "Abandoned Sessions",
          value: stats.abandoned,
          icon: AlertCircle,
          color: stats.abandoned > 5 ? T.red : T.yellow,
        },
        {
          label: "Avg Score",
          value: stats.avgScore !== null ? `${stats.avgScore}` : "—",
          icon: BarChartIcon,
          color: T.green,
        },
      ]
    : [];

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", fontFamily: T.sans }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>System Health</h1>
          <p style={{ fontSize: 14, color: T.dim, marginTop: 4 }}>
            Live snapshot of assessment pipeline and client-side errors.
          </p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div style={{ color: T.dim, fontSize: 14, marginBottom: 32 }}>Loading stats…</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 40,
            }}
          >
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  style={{
                    background: "#fff",
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: "20px 20px 16px",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: card.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Icon size={18} color={T.text} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 6, lineHeight: 1.4 }}>
                    {card.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error log table */}
        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div
            style={{
              padding: "18px 24px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: 16, fontWeight: 600, color: T.text }}>Recent Client Errors</span>
              <span style={{ fontSize: 12, color: T.dim, marginLeft: 10 }}>
                Last 50 entries — captured by ErrorBoundary
              </span>
            </div>
            <button
              onClick={() => loadErrors()}
              style={{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                color: T.text,
                cursor: "pointer",
                fontFamily: T.sans,
              }}
            >
              Refresh
            </button>
          </div>

          {errLoading ? (
            <div style={{ padding: 32, color: T.dim, fontSize: 14 }}>Loading errors…</div>
          ) : errors.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <CheckCircle2 size={32} color={T.green} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>No errors logged</div>
              <div style={{ fontSize: 13, color: T.dim, marginTop: 4 }}>
                Client-side errors caught by ErrorBoundary will appear here.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {["Time", "Type", "Message", "URL"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: T.dim,
                          borderBottom: `1px solid ${T.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e, i) => {
                    const url =
                      typeof e.context?.url === "string"
                        ? e.context.url.replace("https://www.crarity.com", "")
                        : "—";
                    return (
                      <tr
                        key={e.id}
                        style={{
                          borderBottom: i < errors.length - 1 ? `1px solid ${T.border}` : "none",
                        }}
                      >
                        <td style={{ padding: "10px 16px", color: T.dim, whiteSpace: "nowrap" }}>
                          {new Date(e.created_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              background: T.red + "18",
                              color: T.red,
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {e.error_type}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            color: T.text,
                            maxWidth: 360,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={e.error_message}
                        >
                          {e.error_message}
                        </td>
                        <td style={{ padding: "10px 16px", color: T.dim, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={url}>
                          {url}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Inline bar chart icon to avoid extra import complexity
function BarChartIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
