import { useEffect, useState, useCallback } from "react";
import { Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, isAfter } from "date-fns";
import ScheduleInterviewModal from "@/components/interviews/ScheduleInterviewModal";
import { toast } from "sonner";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  off: "#f7f6f3",
  white: "#ffffff",
  lime: "#C5E831",
};

type Row = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  status: string;
  google_meet_link: string | null;
  session_id: string;
  employer_id: string;
  candidate_name: string | null;
  notes: string | null;
};

type StatusFilter = "all" | "scheduled" | "completed" | "cancelled";
type DateFilter = "upcoming" | "past7" | "past30" | "all";

export default function Interviews() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");
  const [rescheduleRow, setRescheduleRow] = useState<Row | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let q = supabase
      .from("interviews")
      .select("id, scheduled_at, duration_minutes, interview_type, status, google_meet_link, session_id, employer_id, notes")
      .eq("employer_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (statusFilter !== "all") {
      q = q.eq("status", statusFilter);
    }

    const { data: ivs } = await q;

    const sessionIds = Array.from(new Set((ivs ?? []).map((i) => i.session_id as string)));
    const { data: sessions } = sessionIds.length
      ? await supabase
          .from("assessment_sessions")
          .select("id, name")
          .in("id", sessionIds)
      : { data: [] as { id: string; name: string | null }[] };

    const sMap = new Map((sessions ?? []).map((s) => [s.id, s]));

    let mapped = (ivs ?? []).map((i) => {
      const s = sMap.get(i.session_id as string);
      return {
        id: i.id as string,
        scheduled_at: i.scheduled_at as string,
        duration_minutes: i.duration_minutes as number,
        interview_type: i.interview_type as string,
        status: i.status as string,
        google_meet_link: (i.google_meet_link as string | null) ?? null,
        session_id: i.session_id as string,
        employer_id: i.employer_id as string,
        candidate_name: s?.name ?? null,
        notes: (i.notes as string | null) ?? null,
      };
    });

    const now = new Date();
    if (dateFilter === "upcoming") {
      mapped = mapped.filter((r) => isAfter(new Date(r.scheduled_at), now));
    } else if (dateFilter === "past7") {
      const cutoff = subDays(now, 7);
      mapped = mapped.filter((r) => {
        const d = new Date(r.scheduled_at);
        return d <= now && isAfter(d, cutoff);
      });
    } else if (dateFilter === "past30") {
      const cutoff = subDays(now, 30);
      mapped = mapped.filter((r) => {
        const d = new Date(r.scheduled_at);
        return d <= now && isAfter(d, cutoff);
      });
    }

    setRows(mapped);
    setLoading(false);
  }, [user, statusFilter, dateFilter]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const cancelInterview = async (id: string) => {
    const { error } = await supabase
      .from("interviews")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error("Failed to cancel interview");
    } else {
      toast.success("Interview cancelled");
      load();
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      scheduled: { bg: T.lime, color: T.text, label: "Scheduled" },
      completed: { bg: "#e5e5e5", color: T.dim, label: "Completed" },
      cancelled: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
    };
    const s = map[status] ?? map.scheduled;
    return (
      <span style={{
        display: "inline-block", padding: "4px 12px", borderRadius: 99,
        background: s.bg, color: s.color, fontSize: 13, fontWeight: 600,
        fontFamily: T.sans,
      }}>
        {s.label}
      </span>
    );
  };

  const formatDateTime = (iso: string) => {
    try {
      return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return iso;
    }
  };

  const STATUS_OPTIONS: { v: StatusFilter; l: string }[] = [
    { v: "all", l: "All" },
    { v: "scheduled", l: "Scheduled" },
    { v: "completed", l: "Completed" },
    { v: "cancelled", l: "Cancelled" },
  ];

  const DATE_OPTIONS: { v: DateFilter; l: string }[] = [
    { v: "upcoming", l: "Upcoming" },
    { v: "past7", l: "Past 7 days" },
    { v: "past30", l: "Past 30 days" },
    { v: "all", l: "All time" },
  ];

  return (
    <DashboardLayout>
      <div style={{ fontFamily: T.sans, color: T.text, maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            Interviews
          </h1>
          <p style={{ fontSize: 15, color: T.dim, marginTop: 6 }}>
            Manage your scheduled and completed candidate interviews.
          </p>
        </div>

        {/* Pill Filters */}
        <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
          <PillGroup options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} />
          <PillGroup options={DATE_OPTIONS} value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)} />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: T.dim }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "120px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: T.off,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}>
              <Calendar size={36} color={T.dim} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: T.sans }}>
              No interviews scheduled yet
            </div>
            <div style={{ fontSize: 14, color: T.dim, maxWidth: 400, fontFamily: T.sans }}>
              Interview requests will appear here once candidates accept
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }} className="interviews-grid">
            {rows.map((r) => (
              <InterviewCard
                key={r.id}
                row={r}
                formatDateTime={formatDateTime}
                statusBadge={statusBadge}
                onReschedule={() => setRescheduleRow(r)}
                onCancel={() => cancelInterview(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {rescheduleRow && user && (
        <ScheduleInterviewModal
          open={!!rescheduleRow}
          onClose={() => setRescheduleRow(null)}
          candidateName={rescheduleRow.candidate_name || "Unnamed"}
          sessionId={rescheduleRow.session_id}
          employerId={user.id}
          existing={{
            id: rescheduleRow.id,
            scheduled_at: rescheduleRow.scheduled_at,
            duration_minutes: rescheduleRow.duration_minutes,
            interview_type: rescheduleRow.interview_type,
            notes: rescheduleRow.notes,
          }}
          onSaved={load}
        />
      )}

      <style>{`
        .interviews-grid {
          grid-template-columns: repeat(3, 1fr) !important;
        }
        @media (max-width: 1024px) {
          .interviews-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .interviews-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

function InterviewCard({ row, formatDateTime, statusBadge, onReschedule, onCancel }: {
  row: Row;
  formatDateTime: (iso: string) => string;
  statusBadge: (status: string) => React.ReactNode;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 24,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.08)" : "none",
        transform: hovered ? "translateY(-2px)" : "none",
        fontFamily: T.sans,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
        {row.candidate_name || "Unnamed"}
      </div>
      <div style={{ fontSize: 14, color: T.dim, marginBottom: 4 }}>
        {formatDateTime(row.scheduled_at)}
      </div>
      <div style={{ fontSize: 14, color: T.dim, marginBottom: 16 }}>
        {row.interview_type}
      </div>
      <div>{statusBadge(row.status)}</div>
      {row.status === "scheduled" && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onReschedule} style={{
            padding: "8px 16px", borderRadius: 8, background: "transparent",
            border: `1px solid ${T.text}`, color: T.text, fontSize: 14,
            fontWeight: 500, cursor: "pointer", fontFamily: T.sans,
            transition: "background 0.15s",
          }}>
            Reschedule
          </button>
          <button onClick={onCancel} style={{
            padding: "8px 16px", borderRadius: 8, background: "transparent",
            border: `1px solid ${T.border}`, color: T.dim, fontSize: 14,
            fontWeight: 500, cursor: "pointer", fontFamily: T.sans,
            transition: "background 0.15s",
          }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function PillGroup({ options, value, onChange }: {
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: value === o.v ? "none" : `1px solid ${T.border}`,
            background: value === o.v ? T.text : T.white,
            color: value === o.v ? T.white : T.text,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: T.sans,
            transition: "all 0.15s ease",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
