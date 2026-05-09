import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type Profile = { id: string; full_name: string | null; email: string | null; company_name: string | null };
type Role = any;
type Session = any;
type Interview = any;

export default function AdminEmployerDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [matchesFor, setMatchesFor] = useState<Role | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: prof }, { data: rs }, { data: ses }, { data: ints }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, company_name").eq("id", id).maybeSingle(),
        supabase.from("roles").select("*").eq("user_id", id),
        supabase.from("assessment_sessions").select("*").eq("completed", true),
        supabase.from("interviews").select("*").eq("employer_id", id),
      ]);
      setProfile(prof as any);
      setRoles(rs || []);
      setSessions(ses || []);
      setInterviews(ints || []);
    })();
  }, [id]);

  const matchesByRole = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const r of roles) {
      const min = r?.custom_requirements?.minimum_score ?? 60;
      map[r.id] = sessions.filter((s) => (s.total_score || 0) >= min);
    }
    return map;
  }, [roles, sessions]);

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, color: T.text }}>
        <Link to="/admin/employers" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.dim, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <ArrowLeft size={16} /> Back to employers
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 8px" }}>{profile?.company_name || profile?.full_name || "Employer"}</h1>
        <div style={{ color: T.dim, fontSize: 14, marginBottom: 40 }}>
          {profile?.full_name || "—"} | {profile?.email || "—"}
        </div>

        {/* Active Roles */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Active Roles</h2>
            <button onClick={() => setShowCreate(true)} style={btnDark}>Create Role <ArrowRight size={16} color={T.green} /></button>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            {roles.length === 0 ? (
              <div style={{ padding: 32, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, color: T.dim, textAlign: "center" }}>No active roles yet.</div>
            ) : roles.map((r) => {
              const req = r.custom_requirements || {};
              const matched = matchesByRole[r.id]?.length || 0;
              return (
                <div key={r.id} style={{ padding: 24, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                      {req.title || (r.role_type === "academic_counselor" ? "Academic Counselor" : r.role_type)}
                      {req.location ? ` — ${req.location}` : ""}
                    </h3>
                    <span style={{ background: T.green, color: T.text, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      {matched} matched
                    </span>
                  </div>
                  <ul style={{ margin: "8px 0 16px", paddingLeft: 18, color: T.dim, fontSize: 13, lineHeight: 1.8 }}>
                    {req.location && <li>Location: {req.location}</li>}
                    {req.weekend_availability && <li>Weekend availability: {req.weekend_availability}</li>}
                    {req.prior_experience && <li>Prior experience: {req.prior_experience}</li>}
                    {req.start_timeline && <li>Start timeline: {req.start_timeline}</li>}
                    {req.minimum_score != null && <li>Minimum score: {req.minimum_score}/100</li>}
                  </ul>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setMatchesFor(r)} style={btnLight}>View Matches</button>
                    <span style={{ fontSize: 12, color: T.dim }}>Created: {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interview Requests */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Interview Requests</h2>
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  {["Candidate", "Role", "Sent Date", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 12, color: T.dim, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interviews.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: T.dim }}>No interview requests yet.</td></tr>
                ) : interviews.map((i) => (
                  <tr key={i.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "14px 20px", fontSize: 14 }}>{i.session_id?.slice(0, 8) || "—"}</td>
                    <td style={{ padding: "14px 20px", fontSize: 14 }}>{i.interview_type}</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: T.dim }}>{new Date(i.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 20px" }}><StatusBadge status={i.status} /></td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: T.dim }}>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && <CreateRoleModal employerId={id!} onClose={() => setShowCreate(false)} onCreated={(r) => { setRoles((prev) => [...prev, r]); setShowCreate(false); }} />}
        {matchesFor && <MatchesModal role={matchesFor} sessions={matchesByRole[matchesFor.id] || []} onClose={() => setMatchesFor(null)} />}
      </div>
    </AdminLayout>
  );
}

const btnDark: React.CSSProperties = {
  background: T.text, color: "#fff", padding: "10px 18px", borderRadius: 999, border: "none", cursor: "pointer",
  fontFamily: T.sans, fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8,
};
const btnLight: React.CSSProperties = {
  background: "#fff", color: T.text, padding: "8px 16px", borderRadius: 999, border: `1px solid ${T.text}`,
  cursor: "pointer", fontFamily: T.sans, fontWeight: 600, fontSize: 13,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    scheduled: { bg: "#fef3c7", fg: "#92400e", label: "Pending" },
    pending: { bg: "#fef3c7", fg: "#92400e", label: "Pending" },
    accepted: { bg: "#dcfce7", fg: "#166534", label: "Accepted" },
    completed: { bg: "#dcfce7", fg: "#166534", label: "Accepted" },
    declined: { bg: "#e5e7eb", fg: "#374151", label: "Declined" },
    cancelled: { bg: "#e5e7eb", fg: "#374151", label: "Declined" },
  };
  const s = map[status] || { bg: "#e5e7eb", fg: "#374151", label: status };
  return <span style={{ background: s.bg, color: s.fg, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
}

function CreateRoleModal({ employerId, onClose, onCreated }: { employerId: string; onClose: () => void; onCreated: (r: any) => void }) {
  const [form, setForm] = useState({
    title: "Academic Counselor - Bangalore",
    location: "Bangalore",
    weekend_availability: "Required",
    prior_experience: "Preferred",
    start_timeline: "Within 15 days",
    minimum_score: 60,
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("roles")
      .insert({ user_id: employerId, role_type: "academic_counselor", is_custom: true, custom_requirements: form, status: "open" })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Role created. Auto-matching candidates...");
    onCreated(data);
  };
  return (
    <div onClick={onClose} style={modalBg}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ ...modalCard, width: 520 }}>
        <div style={modalHead}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Create Role</h2><button type="button" onClick={onClose} style={iconBtn}><X size={20} /></button></div>
        <Field label="Role title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} /></Field>
        <Field label="Location">
          <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inputStyle}>
            {["Bangalore","Mumbai","Delhi","Remote","Willing to Relocate"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Weekend availability">
          <Toggle value={form.weekend_availability} options={["Required","Preferred","Not Required"]} onChange={(v) => setForm({ ...form, weekend_availability: v })} />
        </Field>
        <Field label="Prior experience">
          <Toggle value={form.prior_experience} options={["Required","Preferred","Not Required"]} onChange={(v) => setForm({ ...form, prior_experience: v })} />
        </Field>
        <Field label="Start timeline">
          <select value={form.start_timeline} onChange={(e) => setForm({ ...form, start_timeline: e.target.value })} style={inputStyle}>
            {["Immediate","Within 15 days","Within 1 month","Flexible"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label={`Minimum score: ${form.minimum_score}`}>
          <input type="range" min={0} max={100} value={form.minimum_score} onChange={(e) => setForm({ ...form, minimum_score: Number(e.target.value) })} style={{ width: "100%" }} />
        </Field>
        <button type="submit" style={{ ...btnDark, width: "100%", justifyContent: "center", marginTop: 8 }}>
          Create Role & Auto-Match <ArrowRight size={16} color={T.green} />
        </button>
      </form>
    </div>
  );
}

function MatchesModal({ role, sessions, onClose }: { role: any; sessions: any[]; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const send = () => {
    if (selected.size === 0) { toast.error("Select at least one candidate."); return; }
    toast.success(`Sent ${selected.size} candidate(s) to employer.`);
    onClose();
  };
  return (
    <div onClick={onClose} style={modalBg}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...modalCard, width: 900, maxHeight: "85vh", overflow: "auto" }}>
        <div style={modalHead}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Matched Candidates ({sessions.length})</h2>
          <button onClick={onClose} style={iconBtn}><X size={20} /></button>
        </div>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#fafafa" }}>
              <tr>{["", "Name", "Score", "City", "Weekend", "Experience", "Timeline"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: T.dim, textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.dim }}>No matches yet.</td></tr>
              ) : sessions.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 14px" }}><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} /></td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.name || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>{s.total_score}</td>
                  <td style={{ padding: "10px 14px" }}>{s.city || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>{s.weekend_availability ? "Yes" : "No"}</td>
                  <td style={{ padding: "10px 14px" }}>{s.prior_experience ? (s.prior_experience_duration || "Yes") : "No"}</td>
                  <td style={{ padding: "10px 14px" }}>{s.start_timeline || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={send} style={btnDark}>Send Selected to Employer <ArrowRight size={16} color={T.green} /></button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
function Toggle({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} style={{
          flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          border: `1px solid ${value === o ? T.text : T.border}`,
          background: value === o ? T.text : "#fff",
          color: value === o ? "#fff" : T.text,
        }}>{o}</button>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: T.sans, boxSizing: "border-box", background: "#fff" };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 28, fontFamily: T.sans, maxWidth: "95vw" };
const modalHead: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", padding: 4 };
