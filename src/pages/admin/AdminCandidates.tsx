import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { gamesForRole } from "@/lib/role-labels";
import { computeRisk, RISK_TIER_META, type RiskTier } from "@/lib/anti-cheat";
import type { Telemetry } from "@/hooks/useAssessmentTelemetry";

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
  current_step: string;
  scores: Record<string, Record<string, unknown>>;
  telemetry: Telemetry | null;
  created_at: string;
  updated_at: string;
  admin_approved: boolean;
};

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  bg: "#f7f6f3",
  red: "#ef4444",
  yellow: "#eab308",
  white: "#ffffff",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const PAGE_SIZE = 20;

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function dropOff(s: Session): boolean {
  // updated > 1 day ago and not completed → dropped off
  if (s.completed) return false;
  return Date.now() - new Date(s.updated_at).getTime() > 24 * 60 * 60 * 1000;
}

const pill: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 99,
  border: `1px solid ${T.text}`,
  background: T.white,
  color: T.text,
  fontSize: 14,
  fontFamily: T.sans,
  cursor: "pointer",
  outline: "none",
};

export default function AdminCandidates() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from("assessment_sessions")
        .select("id,name,email,phone,city,role_type,status,total_score,completed,current_step,scores,telemetry,created_at,updated_at,admin_approved")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows((data ?? []) as Session[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const cities = useMemo(() => Array.from(new Set(rows.map((r) => r.city).filter(Boolean) as string[])).sort(), [rows]);

  const maxFor = (role: string) => gamesForRole(role).reduce((s, g) => s + g.maxScore, 0) || 100;

  // IP duplicate counts in the last 24h, used for risk scoring
  const ipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    rows.forEach((r) => {
      const ip = r.telemetry?.ip_address;
      if (!ip) return;
      if (new Date(r.created_at).getTime() < cutoff) return;
      counts[ip] = (counts[ip] ?? 0) + 1;
    });
    return counts;
  }, [rows]);

  const riskFor = (r: Session) => {
    const ip = r.telemetry?.ip_address;
    const dup = ip ? (ipCounts[ip] ?? 0) : 0;
    return computeRisk(r.telemetry, r.scores, dup);
  };

  const filtered = useMemo(() => {
    let out = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      out = out.filter((r) => {
        if (statusFilter === "completed") return r.completed;
        if (statusFilter === "in_progress") return !r.completed && !dropOff(r);
        if (statusFilter === "dropped") return dropOff(r);
        return true;
      });
    }
    if (cityFilter !== "all") out = out.filter((r) => r.city === cityFilter);
    if (dateFilter !== "all") {
      const now = Date.now();
      const ranges: Record<string, number> = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      };
      const ms = ranges[dateFilter];
      if (ms) out = out.filter((r) => now - new Date(r.created_at).getTime() <= ms);
    }
    if (scoreFilter !== "all") {
      out = out.filter((r) => {
        const max = maxFor(r.role_type);
        const pct = max ? (r.total_score / max) * 100 : 0;
        if (scoreFilter === "80") return pct >= 80;
        if (scoreFilter === "60") return pct >= 60 && pct < 80;
        if (scoreFilter === "40") return pct >= 40 && pct < 60;
        if (scoreFilter === "low") return pct < 40;
        return true;
      });
    }
    if (riskFilter !== "all") {
      out = out.filter((r) => riskFor(r).tier === (riskFilter as RiskTier));
    }
    if (approvalFilter !== "all") {
      out = out.filter((r) => {
        if (approvalFilter === "approved") return r.admin_approved;
        if (approvalFilter === "pending") return !r.admin_approved;
        return true;
      });
    }
    return out;
  }, [rows, search, statusFilter, cityFilter, dateFilter, scoreFilter, riskFilter, approvalFilter, ipCounts]);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, statusFilter, cityFilter, dateFilter, scoreFilter, riskFilter, approvalFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const scoreColor = (pct: number) => (pct >= 80 ? "#16a34a" : pct >= 60 ? T.text : T.red);

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, maxWidth: 1400, margin: "0 auto", paddingBottom: selected.size > 0 ? 80 : 0 }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: T.text, marginBottom: 40 }}>Candidates</h1>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ position: "relative", flex: "0 1 400px", minWidth: 240 }}>
            <Search size={16} color={T.dim} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: T.sans,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={pill}>
            <option value="all">Status: All</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="dropped">Dropped Off</option>
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={pill}>
            <option value="all">City: All</option>
            {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={pill}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} style={pill}>
            <option value="all">Score: All</option>
            <option value="80">80+</option>
            <option value="60">60-79</option>
            <option value="40">40-59</option>
            <option value="low">&lt;40</option>
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={pill}>
            <option value="all">Risk: All</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
          <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} style={pill}>
            <option value="all">Approval: All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 32, color: T.dim, fontSize: 14 }}>Loading…</div>
          ) : error ? (
            <div style={{ padding: 32, color: T.red, fontSize: 14 }}>{error}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={th}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    {["Name", "Email", "Phone", "City", "Score", "Risk", "Status", "Submitted", "Approval", "Actions"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: T.dim, fontSize: 14 }}>No candidates match.</td></tr>
                  )}
                  {pageRows.map((r) => {
                    const max = maxFor(r.role_type);
                    const pct = max ? (r.total_score / max) * 100 : 0;
                    const isDropped = dropOff(r);
                    const statusInfo = r.completed
                      ? { label: "Completed", bg: T.green, fg: T.text }
                      : isDropped
                        ? { label: "Dropped Off", bg: "#e5e5e5", fg: T.dim }
                        : { label: "In Progress", bg: "#fef9c3", fg: "#854d0e" };
                    return (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/admin/candidate/${r.id}`)}
                        style={{ cursor: "pointer", transition: "background 150ms" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={td} onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
                        </td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.name ?? "—"}</td>
                        <td style={td}>{r.email ?? "—"}</td>
                        <td style={td}>{r.phone ?? "—"}</td>
                        <td style={td}>{r.city ?? "—"}</td>
                        <td style={{ ...td, color: scoreColor(pct), fontWeight: 600 }}>{r.total_score}/{max}</td>
                        <td style={td}>
                          {(() => {
                            const risk = riskFor(r);
                            const meta = RISK_TIER_META[risk.tier];
                            return (
                              <span title={`Score ${risk.score}/100`} style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: meta.bg, color: meta.fg, fontSize: 12, fontWeight: 600 }}>
                                {meta.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={td}>
                          <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: statusInfo.bg, color: statusInfo.fg, fontSize: 12, fontWeight: 600 }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ ...td, color: T.dim, fontSize: 12 }}>{timeAgo(r.created_at)}</td>
                        <td style={td} onClick={(e) => e.stopPropagation()}>
                          {r.admin_approved ? (
                            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "#E6F4D7", color: "#3d6b00", fontSize: 12, fontWeight: 600, border: "1px solid #C5E831" }}>
                              ✓ Approved
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("assessment_sessions")
                                  .update({ admin_approved: true })
                                  .eq("id", r.id);
                                if (error) { toast.error(error.message); return; }
                                setRows((prev) => prev.map((row) => row.id === r.id ? { ...row, admin_approved: true } : row));
                                toast.success(`${r.name ?? "Candidate"} approved for employers!`);
                              }}
                              style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: T.green, color: T.text, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                        <td style={td} onClick={(e) => e.stopPropagation()}>
                          <Link to={`/admin/candidate/${r.id}`} style={{ display: "inline-block", padding: "6px 14px", borderRadius: 99, background: T.text, color: T.white, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...pill, padding: "6px 12px", opacity: page === 1 ? 0.4 : 1 }}>‹</button>
            <span style={{ fontSize: 14, color: T.dim }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...pill, padding: "6px 12px", opacity: page === totalPages ? 0.4 : 1 }}>›</button>
          </div>
        )}

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.text, color: T.white, padding: "12px 20px", borderRadius: 99, display: "flex", alignItems: "center", gap: 16, fontFamily: T.sans, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 30 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{selected.size} candidate{selected.size === 1 ? "" : "s"} selected</span>
            <span style={{ width: 1, height: 20, background: "#444" }} />
            <button
              onClick={async () => {
                const ids = Array.from(selected);
                const { error } = await supabase
                  .from("assessment_sessions")
                  .update({ admin_approved: true })
                  .in("id", ids);
                if (error) { toast.error(error.message); return; }
                setRows((prev) => prev.map((r) => ids.includes(r.id) ? { ...r, admin_approved: true } : r));
                toast.success(`${ids.length} candidate${ids.length === 1 ? "" : "s"} approved!`);
                setSelected(new Set());
              }}
              style={{ background: T.green, border: "none", color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 14px", borderRadius: 99 }}
            >
              ✓ Approve Selected
            </button>
            <button
              onClick={async () => {
                if (!window.confirm(`Delete ${selected.size} candidate${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
                const ids = Array.from(selected);
                const { error } = await supabase
                  .from("assessment_sessions")
                  .delete()
                  .in("id", ids);
                if (error) { toast.error(error.message); return; }
                setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
                toast.success(`${ids.length} candidate${ids.length === 1 ? "" : "s"} deleted`);
                setSelected(new Set());
              }}
              style={{ background: "#ef4444", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 14px", borderRadius: 99 }}
            >
              Delete
            </button>
            <button onClick={() => setSelected(new Set())} style={{ background: "transparent", border: "none", color: T.dim, fontSize: 13, cursor: "pointer", marginLeft: 4 }}>Clear</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "16px",
  borderBottom: `1px solid ${T.border}`,
  fontSize: 12,
  fontWeight: 500,
  color: T.dim,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "16px",
  borderBottom: `1px solid ${T.border}`,
  fontSize: 14,
  color: T.text,
  whiteSpace: "nowrap",
};
