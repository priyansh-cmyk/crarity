import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
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

type EmployerRow = {
  id: string;
  company: string;
  contact: string;
  email: string;
  rolesCount: number;
  matched: number;
  sent: number;
  accepted: number;
};

export default function AdminEmployers() {
  const [rows, setRows] = useState<EmployerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, company_name");
      const { data: roles } = await supabase
        .from("roles")
        .select("id, user_id, status");
      const { data: cr } = await supabase
        .from("candidate_roles")
        .select("role_id, user_id");
      const { data: interviews } = await supabase
        .from("interviews")
        .select("employer_id, status");

      const out: EmployerRow[] = (profiles || []).map((p: any) => {
        const userRoles = (roles || []).filter((r: any) => r.user_id === p.id);
        const roleIds = new Set(userRoles.map((r: any) => r.id));
        const matched = (cr || []).filter((c: any) => roleIds.has(c.role_id)).length;
        const empInts = (interviews || []).filter((i: any) => i.employer_id === p.id);
        const accepted = empInts.filter((i: any) => i.status === "accepted" || i.status === "completed").length;
        return {
          id: p.id,
          company: p.company_name || p.full_name || "—",
          contact: p.full_name || "—",
          email: p.email || "—",
          rolesCount: userRoles.filter((r: any) => r.status === "open").length,
          matched,
          sent: empInts.length,
          accepted,
        };
      });
      setRows(out);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, color: T.text }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0 }}>Employers</h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: T.text,
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontFamily: T.sans,
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Add Employer <ArrowRight size={16} color={T.green} />
          </button>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.sans }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  {["Company", "Contact Person", "Email", "Roles Posted", "Matched Candidates", "Interview Requests", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${T.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: T.dim }}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: T.dim }}>No employers yet.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600 }}>{r.company}</td>
                      <td style={{ padding: "16px 20px", fontSize: 14 }}>{r.contact}</td>
                      <td style={{ padding: "16px 20px", fontSize: 14, color: T.dim }}>{r.email}</td>
                      <td style={{ padding: "16px 20px", fontSize: 14 }}>{r.rolesCount} active {r.rolesCount === 1 ? "role" : "roles"}</td>
                      <td style={{ padding: "16px 20px", fontSize: 14 }}>{r.matched} matched</td>
                      <td style={{ padding: "16px 20px", fontSize: 14 }}>{r.sent} sent, {r.accepted} accepted</td>
                      <td style={{ padding: "16px 20px" }}>
                        <Link
                          to={`/admin/employers/${r.id}`}
                          style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            borderRadius: 999,
                            border: `1px solid ${T.text}`,
                            background: "#fff",
                            color: T.text,
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAdd && <AddEmployerModal onClose={() => setShowAdd(false)} />}
      </div>
    </AdminLayout>
  );
}

function AddEmployerModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ company: "", contact: "", email: "", phone: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Employer invitation noted. They'll need to sign up to access the portal.");
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, maxWidth: "92vw", fontFamily: T.sans }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Add Employer</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {[
          { k: "company", label: "Company name", type: "text" },
          { k: "contact", label: "Contact person", type: "text" },
          { k: "email", label: "Email", type: "email" },
          { k: "phone", label: "Phone", type: "text" },
        ].map((f) => (
          <div key={f.k} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: T.text }}>{f.label}</label>
            <input
              required
              type={f.type}
              value={(form as any)[f.k]}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: T.sans, boxSizing: "border-box" }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Industry</label>
          <input disabled value="EdTech" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, background: "#f7f6f3", color: T.dim, boxSizing: "border-box" }} />
        </div>
        <button type="submit" style={{ width: "100%", padding: "12px 20px", borderRadius: 999, background: T.text, color: "#fff", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Submit <ArrowRight size={16} color={T.green} />
        </button>
      </form>
    </div>
  );
}
