import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const GAMES = [
  { key: "game1", label: "Pick Your Shot" },
  { key: "game2", label: "Say It Like You Mean It" },
  { key: "game3", label: "Beyond The Student" },
  { key: "game4", label: "Handle the Heat" },
];
const DEFAULTS = { game1: 25, game2: 25, game3: 25, game4: 25 };
const STORAGE_KEY = "admin_scoring_weights";

type Tab = "scoring" | "account" | "security";

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>("scoring");
  return (
    <AdminLayout>
      <div style={{ fontFamily: T.sans, color: T.text }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, marginBottom: 40 }}>Settings</h1>

        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 32 }}>
          {(["scoring", "account", "security"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "12px 20px",
                background: "none",
                border: "none",
                borderBottom: tab === t ? `3px solid ${T.green}` : "3px solid transparent",
                color: tab === t ? T.text : T.dim,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: T.sans,
                textTransform: "capitalize",
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "scoring" && <ScoringTab />}
        {tab === "account" && <AccountTab />}
        {tab === "security" && <SecurityTab />}
      </div>
    </AdminLayout>
  );
}

function ScoringTab() {
  const [w, setW] = useState<Record<string, number>>(DEFAULTS);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setW({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const total = useMemo(() => GAMES.reduce((s, g) => s + (w[g.key] || 0), 0), [w]);
  const valid = total === 100;

  const set = (k: string, v: number) => {
    const n = Math.max(0, Math.min(100, Math.round(v) || 0));
    setW((p) => ({ ...p, [k]: n }));
  };

  const save = () => {
    if (!valid) { toast.error("Cannot save. Total must equal 100%."); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
    toast.success("Scoring updated successfully");
  };

  const reset = () => { setW(DEFAULTS); setConfirmReset(false); toast.success("Reset to default weights"); };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>Assessment Scoring Configuration</h2>
      <p style={{ color: T.dim, fontSize: 14, marginTop: 0, marginBottom: 24 }}>
        Configure how each game is weighted in the overall score. Total must equal 100%.
      </p>

      <div style={{ display: "grid", gap: 24 }}>
        {GAMES.map((g) => (
          <div key={g.key} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{g.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={w[g.key]}
                  onChange={(e) => set(g.key, Number(e.target.value))}
                  style={{ width: 80, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: T.sans, textAlign: "right" }}
                />
                <span style={{ fontSize: 14, color: T.dim }}>%</span>
              </div>
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 16 }}>{w[g.key]}%</div>
            <input
              type="range"
              min={0}
              max={100}
              value={w[g.key]}
              onChange={(e) => set(g.key, Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: T.green,
              }}
            />
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 24, padding: 20, borderRadius: 12,
        border: `1px solid ${valid ? "#bbf7d0" : "#fecaca"}`,
        background: valid ? "#f0fdf4" : "#fef2f2",
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Total: {total}%</div>
        {valid ? (
          <div style={{ color: "#166534", fontSize: 14 }}>✓ Total equals 100%</div>
        ) : (
          <div style={{ color: "#b91c1c", fontSize: 14 }}>⚠️ Total must equal 100%. Current total: {total}%</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          onClick={save}
          disabled={!valid}
          style={{
            padding: "12px 24px", borderRadius: 999, border: "none",
            background: valid ? T.text : "#ccc", color: "#fff",
            fontWeight: 600, fontSize: 14, cursor: valid ? "pointer" : "not-allowed",
            display: "inline-flex", alignItems: "center", gap: 8, fontFamily: T.sans,
          }}
        >
          Save Changes <ArrowRight size={16} color={T.green} />
        </button>
        <button
          onClick={() => setConfirmReset(true)}
          style={{
            padding: "12px 24px", borderRadius: 999, border: `1px solid ${T.text}`,
            background: "#fff", color: T.text, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: T.sans,
          }}
        >
          Reset to Default
        </button>
      </div>

      {confirmReset && (
        <div onClick={() => setConfirmReset(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, fontFamily: T.sans }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Reset to defaults?</h3>
            <p style={{ color: T.dim, fontSize: 14, marginTop: 0, marginBottom: 20 }}>All four games will be reset to 25% each.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmReset(false)} style={{ padding: "10px 16px", borderRadius: 999, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontFamily: T.sans, fontWeight: 600 }}>Cancel</button>
              <button onClick={reset} style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: T.text, color: "#fff", cursor: "pointer", fontFamily: T.sans, fontWeight: 600 }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountTab() {
  const [info, setInfo] = useState({ name: "Admin", email: "—" });
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setInfo({ name: data.user.user_metadata?.full_name || "Admin", email: data.user.email || "—" });
    });
  }, []);
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 24 }}>Account Information</h2>
      <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 560 }}>
        {[
          { label: "Name", value: info.name, key: "name" },
          { label: "Email", value: info.email, key: "email" },
          { label: "Role", value: "Administrator", key: "role", locked: true },
        ].map((f) => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
            <input
              readOnly={!editing || f.locked}
              value={f.value}
              onChange={(e) => setInfo({ ...info, [f.key]: e.target.value } as any)}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: T.sans, background: (!editing || f.locked) ? "#f7f6f3" : "#fff", color: T.text, boxSizing: "border-box" }}
            />
          </div>
        ))}
        <button
          onClick={() => { if (editing) toast.success("Account updated"); setEditing(!editing); }}
          style={{ marginTop: 8, padding: "10px 20px", borderRadius: 999, border: `1px solid ${T.text}`, background: editing ? T.text : "#fff", color: editing ? "#fff" : T.text, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: T.sans }}
        >
          {editing ? "Save" : "Edit"}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [tfa, setTfa] = useState(false);
  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (pw.next !== pw.confirm) { toast.error("Passwords do not match"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    setPw({ current: "", next: "", confirm: "" });
  };
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 24 }}>Security Settings</h2>
      <form onSubmit={update} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 560, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Change Password</h3>
        {[
          { k: "current", label: "Current password" },
          { k: "next", label: "New password" },
          { k: "confirm", label: "Confirm new password" },
        ].map((f) => (
          <div key={f.k} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
            <input
              type="password"
              required
              value={(pw as any)[f.k]}
              onChange={(e) => setPw({ ...pw, [f.k]: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: T.sans, boxSizing: "border-box" }}
            />
          </div>
        ))}
        <button type="submit" style={{ marginTop: 8, padding: "10px 20px", borderRadius: 999, border: "none", background: T.text, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: T.sans }}>
          Update Password
        </button>
      </form>

      <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 560, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Two-factor authentication</div>
          <div style={{ fontSize: 13, color: T.dim }}>Add extra security to your account</div>
        </div>
        <button
          onClick={() => { setTfa(!tfa); toast(tfa ? "2FA disabled" : "2FA enabled (demo)"); }}
          aria-pressed={tfa}
          style={{
            width: 48, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
            background: tfa ? T.green : "#d1d5db", position: "relative", transition: "background 150ms",
          }}
        >
          <span style={{
            position: "absolute", top: 2, left: tfa ? 22 : 2,
            width: 24, height: 24, borderRadius: "50%", background: "#fff",
            transition: "left 150ms", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>
    </div>
  );
}
