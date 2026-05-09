import { useEffect, useState } from "react";
import { Eye, EyeOff, AlertTriangle, ChevronDown, Check, X } from "lucide-react";
import CandidateLayout from "@/components/dashboard/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  white: "#ffffff",
  green: "#C5E831",
  greenTint: "#f4fadc",
  red: "#dc2626",
  redSoft: "#fef2f2",
};

const STATUS_OPTIONS = [
  { value: "looking", label: "Looking for a Job" },
  { value: "hired", label: "Hired" },
  { value: "break", label: "Taking a Break" },
];

export default function CandidateSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailEditing, setEmailEditing] = useState(false);

  // Status
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("looking");
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_sessions")
        .select("id, candidate_status")
        .eq("updated_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      setSessionId(data.id);
      setStatus(data.candidate_status ?? "looking");
    })();
    return () => { cancelled = true; };
  }, [user]);

  const updatePassword = async () => {
    if (newPwd.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setUpdatingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setUpdatingPwd(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    toast({ title: "Password updated" });
  };

  const changeEmail = async () => {
    const e = newEmail.trim();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: e });
    setChangingEmail(false);
    if (error) {
      toast({ title: "Couldn't change email", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Verification sent", description: `Check ${e} to confirm the change.` });
    setEmailEditing(false);
    setNewEmail("");
  };

  const updateStatus = async (value: string) => {
    setStatusOpen(false);
    if (!sessionId || value === status) return;
    const prev = status;
    setStatus(value);
    setStatusSaving(true);
    const { error } = await supabase
      .from("assessment_sessions")
      .update({ candidate_status: value })
      .eq("id", sessionId);
    setStatusSaving(false);
    if (error) {
      setStatus(prev);
      toast({ title: "Couldn't update status", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status updated" });
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    // Best-effort: scrub PII from candidate's session row, then sign out.
    // Full account deletion from auth requires a server-side admin call.
    if (sessionId) {
      await supabase
        .from("assessment_sessions")
        .update({
          name: null, email: null, phone: null, city: null,
          languages: [], resume_url: null,
        })
        .eq("id", sessionId);
    }
    await signOut();
    setDeleting(false);
    toast({
      title: "Account data cleared",
      description: "Your profile data has been removed. Contact support to fully delete your login.",
    });
    navigate("/assessment/academic-counselor/login", { replace: true });
  };

  const currentStatus = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 820, fontFamily: T.sans, color: T.text, paddingBottom: 80 }}>
        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, margin: 0 }}>
            Settings
          </h1>
          <p style={{ fontSize: 16, color: T.dim, margin: "10px 0 0" }}>Manage your account settings.</p>
        </header>

        {/* Section 1: Change Password */}
        <Card>
          <h2 style={cardTitle}>Change password</h2>
          <div style={{ display: "grid", gap: 14, marginTop: 16, maxWidth: 420 }}>
            <Field label="Current password">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password">
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 40 }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", cursor: "pointer", color: T.dim, padding: 6,
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm new password">
              <input
                type={showNew ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                style={inputStyle}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </Field>
            <div>
              <button
                onClick={updatePassword}
                disabled={updatingPwd || !newPwd || !confirmPwd}
                style={{
                  ...primaryPill,
                  opacity: updatingPwd || !newPwd || !confirmPwd ? 0.55 : 1,
                  cursor: updatingPwd ? "wait" : "pointer",
                }}
              >
                {updatingPwd ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>
        </Card>

        {/* Section 2: Email Preferences */}
        <div style={{ marginTop: 24 }}>
          <Card>
            <h2 style={cardTitle}>Email preferences</h2>
            <div style={{ marginTop: 16 }}>
              <Field label="Email address">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ ...inputStyle, background: "#fafaf8", color: T.text, flex: 1 }}>
                    {user?.email ?? "—"}
                  </div>
                  {!emailEditing && (
                    <button onClick={() => { setEmailEditing(true); setNewEmail(user?.email ?? ""); }} style={secondaryPill}>
                      Change email
                    </button>
                  )}
                </div>
              </Field>
              {emailEditing && (
                <div style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 420 }}>
                  <Field label="New email address">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={inputStyle}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <p style={{ fontSize: 13, color: T.dim, margin: 0 }}>
                    We'll send a verification link to the new address. Your email won't change until you confirm.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={changeEmail} disabled={changingEmail} style={{ ...primaryPill, opacity: changingEmail ? 0.7 : 1 }}>
                      {changingEmail ? "Sending…" : "Send verification"}
                    </button>
                    <button onClick={() => { setEmailEditing(false); setNewEmail(""); }} style={secondaryPill}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Section 3: Account Status */}
        <div style={{ marginTop: 24 }}>
          <Card>
            <h2 style={cardTitle}>Account status</h2>
            <p style={{ fontSize: 14, color: T.dim, margin: "6px 0 16px" }}>
              Let employers know whether you're open to opportunities.
            </p>
            <div style={{ position: "relative", display: "inline-block" }}>
              <button
                onClick={() => setStatusOpen((v) => !v)}
                disabled={statusSaving || !sessionId}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", background: T.white, border: `1px solid ${T.border}`,
                  borderRadius: 99, fontFamily: T.sans, fontSize: 14, fontWeight: 600,
                  color: T.text, cursor: sessionId ? "pointer" : "not-allowed",
                  opacity: sessionId ? 1 : 0.6, minWidth: 220, justifyContent: "space-between",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: status === "looking" ? T.green : T.dim,
                  }} />
                  {currentStatus.label}
                </span>
                <ChevronDown size={16} color={T.dim} />
              </button>
              {statusOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0,
                    background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)", zIndex: 10, minWidth: 220, overflow: "hidden",
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "10px 14px", background: "transparent",
                        border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 14,
                        color: T.text, textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {opt.label}
                      {opt.value === status && <Check size={14} color={T.text} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Section 4: Danger Zone */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.red}`,
              borderRadius: 8,
              padding: 24,
            }}
          >
            <h2 style={{ ...cardTitle, color: T.red, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={18} /> Delete account
            </h2>
            <p style={{ fontSize: 14, color: T.dim, margin: "10px 0 16px" }}>
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", padding: "10px 18px",
                background: T.white, color: T.red, border: `1px solid ${T.red}`,
                borderRadius: 99, fontFamily: T.sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Delete my account
            </button>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {deleteOpen && (
          <div
            onClick={() => !deleting && setDeleteOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: T.white, borderRadius: 14, maxWidth: 460, width: "100%",
                padding: 28, fontFamily: T.sans,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: T.redSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <AlertTriangle size={20} color={T.red} />
                </div>
                <button
                  onClick={() => !deleting && setDeleteOpen(false)}
                  aria-label="Close"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: T.dim }}
                >
                  <X size={18} />
                </button>
              </div>
              <h3 style={{ margin: "16px 0 8px", fontSize: 20, fontWeight: 700 }}>Delete your account?</h3>
              <p style={{ fontSize: 14, color: T.dim, margin: 0, lineHeight: 1.5 }}>
                This will permanently remove your profile, languages, resume, and assessment data.
                You'll be signed out immediately. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button onClick={() => setDeleteOpen(false)} disabled={deleting} style={secondaryPill}>
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  style={{
                    display: "inline-flex", alignItems: "center", padding: "10px 18px",
                    background: T.red, color: T.white, border: "none", borderRadius: 99,
                    fontFamily: T.sans, fontSize: 14, fontWeight: 600,
                    cursor: deleting ? "wait" : "pointer", opacity: deleting ? 0.85 : 1,
                  }}
                >
                  {deleting ? "Deleting…" : "Yes, delete my account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}

/* ---------- helpers ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 600, color: T.dim,
        textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: T.text,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: T.sans,
  color: T.text,
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
};

const primaryPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 20px",
  background: T.text,
  color: T.white,
  border: "none",
  borderRadius: 99,
  fontFamily: T.sans,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 16px",
  background: T.white,
  color: T.text,
  border: `1px solid ${T.border}`,
  borderRadius: 99,
  fontFamily: T.sans,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
