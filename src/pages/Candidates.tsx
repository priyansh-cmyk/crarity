import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, Eye, MapPin, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import ImportCandidatesModal from "@/components/candidates/ImportCandidatesModal";
import { formatDistanceToNow } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel } from "@/lib/role-labels";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaa",
  border: "#e8e3d8",
  green: "#C5E831",
  white: "#ffffff",
  off: "#fafaf8",
};

const PASTELS = [
  "#FDE9C9", "#D7EFD9", "#E8E0F5", "#FAD7DC",
  "#D6ECF3", "#FFF1B8", "#E8F0CB", "#F4D6E8",
];

type SessionRow = {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  total_score: number;
  updated_at: string;
  role_id: string | null;
  role_type: string;
  source: "pool" | "imported" | "demo";
  completed: boolean;
  pipeline_status: string;
  candidate_status: string;
};


type DateFilter = "7" | "30" | "all";
type SourceFilter = "all" | "pool" | "imported";
type StatusFilter = "all" | "shortlisted" | "interview_sent" | "rejected" | "new";

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
  if (score >= 28) return { label: "High match", bg: "#E6F4D7", fg: "#3d6b00", border: "#C5E831" };
  if (score >= 20) return { label: "Potential", bg: "#FFF4CE", fg: "#7a5a00", border: "#F0D265" };
  return { label: "Low match", bg: "#f1f1ee", fg: "#6b6b6b", border: "#e8e3d8" };
};

export default function Candidates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const initialSource = (searchParams.get("source") as SourceFilter | null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(
    initialSource === "pool" || initialSource === "imported" ? initialSource : "all"
  );
  const [importOpen, setImportOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync source filter to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (sourceFilter === "all") next.delete("source");
    else next.set("source", sourceFilter);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [sourceFilter]);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);

      // 1. Fetch all admin-approved completed sessions (visible to all employers)
      //    PLUS any sessions this employer imported (invited_by = user.id)
      const { data: sessions, error: sessErr } = await supabase
        .from("assessment_sessions")
        .select("id, name, email, city, total_score, updated_at, role_id, role_type, source, completed, candidate_status")
        .or(`and(admin_approved.eq.true,completed.eq.true),invited_by.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (sessErr || cancelled) {
        if (!cancelled) { setRows([]); setLoading(false); }
        return;
      }

      // 2. Fetch this employer's pipeline entries so we can show per-employer status
      const { data: pipelineData } = await supabase
        .from("employer_candidate_pipeline")
        .select("session_id, status")
        .eq("employer_id", user.id);

      if (cancelled) return;

      const pipelineMap = new Map<string, string>(
        (pipelineData ?? []).map((p) => [p.session_id as string, p.status as string])
      );

      const mapped: SessionRow[] = (sessions ?? []).map((s) => ({
        id: s.id as string,
        name: (s.name as string | null) ?? null,
        email: (s.email as string | null) ?? null,
        city: (s.city as string | null) ?? null,
        total_score: (s.total_score as number) ?? 0,
        updated_at: s.updated_at as string,
        role_id: (s.role_id as string | null) ?? null,
        role_type: (s.role_type as string) ?? "",
        source: ((s.source as string) ?? "pool") as "pool" | "imported" | "demo",
        completed: Boolean(s.completed),
        pipeline_status: pipelineMap.get(s.id as string) ?? "new",
        candidate_status: (s.candidate_status as string) ?? "looking",
      }));

      if (!cancelled) {
        setRows(mapped);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, authLoading, refreshKey]);

  // Apply all filters EXCEPT source — used for source counts
  const baseFiltered = useMemo(() => {
    const now = Date.now();
    const cutoffMs =
      dateFilter === "7" ? 7 * 24 * 60 * 60 * 1000 :
      dateFilter === "30" ? 30 * 24 * 60 * 60 * 1000 :
      Infinity;
    return rows.filter((r) => {
      // Hide demo candidates unless toggle is on
      if (r.source === "demo" && !showDemo) return false;
      if (cutoffMs !== Infinity) {
        const t = new Date(r.updated_at).getTime();
        if (Number.isNaN(t) || now - t > cutoffMs) return false;
      }
      // Pipeline status filter
      if (statusFilter !== "all" && r.pipeline_status !== statusFilter) return false;
      return true;
    });
  }, [rows, dateFilter, statusFilter, showDemo]);

  const sourceCounts = useMemo(() => ({
    all: baseFiltered.length,
    pool: baseFiltered.filter((r) => r.source === "pool").length,
    imported: baseFiltered.filter((r) => r.source === "imported").length,
  }), [baseFiltered]);

  const filtered = useMemo(() => {
    if (sourceFilter === "all") return baseFiltered;
    return baseFiltered.filter((r) => r.source === sourceFilter);
  }, [baseFiltered, sourceFilter]);

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) {
          .cr-cand-table-wrap { display: none !important; }
          .cr-cand-cards { display: flex !important; }
          .cr-cand-filters { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ fontFamily: T.sans, color: T.text, maxWidth: 1200 }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
              Candidates
            </h1>
            <p style={{ fontSize: 15, color: T.dim, marginTop: 6 }}>
              Candidates who completed assessments for your roles.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setShowDemo(!showDemo)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: `1px solid ${showDemo ? T.green : T.border}`,
                background: showDemo ? "#f0ffc8" : T.white,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: T.sans,
                color: T.text,
              }}
            >
              {showDemo ? "Hide demo" : "Show demo"}
            </button>
          <button
            onClick={() => setImportOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: T.text,
              color: "#fff",
              border: "none",
              padding: "10px 12px 10px 20px",
              borderRadius: 99,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: T.sans,
            }}
          >
            Import Candidates
            <span
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: T.green,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: T.text,
              }}
            >
              <ArrowRight size={14} />
            </span>
          </button>
          </div>
        </div>



        {/* Filters */}
        <div
          style={{
            background: T.white,
            border: `1px solid #e5e5e5`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          <div
            className="cr-cand-filters"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              alignItems: "end",
            }}
          >
            {/* Status */}
            <div>
              <label style={{ fontSize: 13, color: T.dim, fontWeight: 500, display: "block", marginBottom: 8 }}>
                Status
              </label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger style={{ height: 44, borderColor: "#e5e5e5", background: T.white, borderRadius: 8, fontSize: 14, color: "#1a1a1a", fontFamily: T.sans }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview_sent">Interview Scheduled</SelectItem>
                  <SelectItem value="rejected">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div>
              <label style={{ fontSize: 13, color: T.dim, fontWeight: 500, display: "block", marginBottom: 8 }}>
                Source
              </label>
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
                <SelectTrigger style={{ height: 44, borderColor: "#e5e5e5", background: T.white, borderRadius: 8, fontSize: 14, color: "#1a1a1a", fontFamily: T.sans }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources ({sourceCounts.all})</SelectItem>
                  <SelectItem value="pool">Your Pool ({sourceCounts.pool})</SelectItem>
                  <SelectItem value="imported">Imported ({sourceCounts.imported})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date submitted */}
            <div>
              <label style={{ fontSize: 13, color: T.dim, fontWeight: 500, display: "block", marginBottom: 8 }}>
                Date submitted
              </label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger style={{ height: 44, borderColor: "#e5e5e5", background: T.white, borderRadius: 8, fontSize: 14, color: "#1a1a1a", fontFamily: T.sans }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: 80,
              textAlign: "center",
              color: T.dim,
              fontSize: 15,
            }}
          >
            Loading candidates…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={rows.length > 0} />
        ) : (
          <>
            {/* Desktop table */}
            <div
              className="cr-cand-table-wrap"
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr",
                  padding: "14px 24px",
                  borderBottom: `1px solid ${T.border}`,
                  background: T.off,
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.dim,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <div>Name</div>
                <div>Overall Score</div>
                <div>Location</div>
                <div>Date Submitted</div>
                <div>Status</div>
                <div style={{ textAlign: "right" }}>Actions</div>
              </div>

              {filtered.map((r, idx) => {
                const ps = r.pipeline_status;
                const statusConfig: Record<string, { label: string; bg: string; fg: string; border: string }> = {
                  new: { label: "New", bg: "#DBEAFE", fg: "#1d4ed8", border: "#93c5fd" },
                  shortlisted: { label: "Shortlisted", bg: "#E6F4D7", fg: "#3d6b00", border: "#C5E831" },
                  interview_sent: { label: "Interview Scheduled", bg: "#FFF4CE", fg: "#7a5a00", border: "#F0D265" },
                  interview_requested: { label: "Interview Requested", bg: "#FFF4CE", fg: "#7a5a00", border: "#F0D265" },
                  rejected: { label: "Rejected", bg: "#f1f1ee", fg: "#6b6b6b", border: "#e8e3d8" },
                };
                const st = statusConfig[ps] ?? statusConfig.new;
                const scoreColor = r.total_score >= 36 ? "#16a34a" : r.total_score >= 32 ? T.text : T.dim;
                const dateStr = new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <div
                    key={r.id}
                    onClick={() => r.completed && navigate(`/candidates/${r.id}`)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr",
                      padding: "20px 24px",
                      alignItems: "center",
                      borderBottom: idx < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                      transition: "background 120ms ease",
                      cursor: r.completed ? "pointer" : "default",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = T.off; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: colorFor(r.id),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 600, color: T.text, flexShrink: 0,
                        }}
                      >
                        {initials(r.name)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.name || "Unnamed"}
                        </div>
                        {r.candidate_status === "break" && (
                          <span
                            title="Candidate is currently taking a break"
                            style={{
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: "#FFF4CE",
                              color: "#7a5a00",
                              border: "1px solid #F0D265",
                              fontSize: 10,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            On a break
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor }}>
                      {r.completed ? r.total_score : "—"}
                    </div>
                    <div style={{ fontSize: 14, color: T.dim }}>{r.city || "—"}</div>
                    <div style={{ fontSize: 14, color: T.dim }}>{dateStr}</div>
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 12px",
                          borderRadius: 99,
                          background: st.bg, color: st.fg,
                          border: `1px solid ${st.border}`,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/candidates/${r.id}`); }}
                        disabled={!r.completed}
                        style={{
                          background: "transparent",
                          color: r.completed ? T.text : T.dimmer,
                          border: `1px solid ${T.border}`,
                          padding: "6px 14px", borderRadius: 99, fontSize: 13,
                          fontWeight: 500, cursor: r.completed ? "pointer" : "not-allowed",
                          fontFamily: T.sans,
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile cards */}
            <div
              className="cr-cand-cards"
              style={{ display: "none", flexDirection: "column", gap: 12 }}
            >
              {filtered.map((r) => {
                const badge = matchBadge(r.total_score);
                return (
                  <div
                    key={r.id}
                    style={{
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      borderRadius: 16,
                      padding: 20,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: colorFor(r.id),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 600,
                        }}
                      >
                        {initials(r.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>{r.name || "Unnamed"}</div>
                          {r.candidate_status === "break" && (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: "#FFF4CE",
                                color: "#7a5a00",
                                border: "1px solid #F0D265",
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                              }}
                            >
                              On a break
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: T.dimmer, marginTop: 2 }}>
                          {roleLabel(r.role_type)}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "4px 10px", borderRadius: 99,
                          background: badge.bg, color: badge.fg,
                          border: `1px solid ${badge.border}`,
                          fontSize: 11, fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 32, fontWeight: 700 }}>{r.total_score}</span>
                      <span style={{ fontSize: 14, color: T.dimmer }}>/ 40</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: T.dim, marginBottom: 16 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={13} /> {r.city || "—"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarIcon size={13} />
                        {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/candidates/${r.id}`)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: T.text, color: T.white, border: "none",
                        padding: "10px 18px", borderRadius: 99, fontSize: 14,
                        fontWeight: 500, cursor: "pointer", fontFamily: T.sans,
                        width: "100%", justifyContent: "center",
                      }}
                    >
                      <Eye size={14} /> View profile
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {user && importOpen && (
        <ImportCandidatesModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={() => setRefreshKey((k) => k + 1)}
          userId={user.id}
          defaultRoleId=""
          defaultRoleType=""
        />
      )}
    </DashboardLayout>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid T.border`,
        borderRadius: 16,
        padding: "80px 24px",
        textAlign: "center",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          width: 120, height: 120, borderRadius: "50%",
          background: T.off, border: `1px solid ${T.border}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Briefcase size={64} color={T.dim} strokeWidth={1.4} />
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 700, color: T.text, margin: 0, marginTop: 32, fontFamily: T.sans }}>
        {hasAny ? "No matches" : "No candidates available yet"}
      </h2>
      <p style={{ fontSize: 16, color: T.dim, margin: 0, marginTop: 16, maxWidth: 520, marginInline: "auto", lineHeight: 1.6, fontFamily: T.sans }}>
        {hasAny
          ? "Try adjusting your filters to see more candidates."
          : "We'll notify you as soon as admin-approved candidates are available."}
      </p>
    </div>
  );
}
