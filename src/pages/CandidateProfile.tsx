import { useEffect, useRef, useState } from "react";
import { ArrowRight, Upload, FileText, Download, Pencil, X } from "lucide-react";
import CandidateLayout from "@/components/dashboard/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  borderSoft: "#eeeae0",
  white: "#ffffff",
  green: "#C5E831",
  greenTint: "#f4fadc",
};

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Other"];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

type Session = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  languages: string[] | null;
  resume_url: string | null;
};

const IS_STAGING =
  import.meta.env.VITE_APP_ENV === "staging" ||
  window.location.hostname.includes("staging") ||
  window.location.hostname.includes("crarity-git-staging");

const STAGING_SESSION: Session = {
  id: "staging-profile",
  name: "Priya Sharma",
  email: "priya@example.com",
  phone: "+91 98765 43210",
  city: "Mumbai",
  languages: ["English", "Hindi"],
  resume_url: null,
};

export default function CandidateProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(!IS_STAGING);
  const [session, setSession] = useState<Session | null>(IS_STAGING ? STAGING_SESSION : null);

  // edit-mode state
  const [editPersonal, setEditPersonal] = useState(false);
  const [editLanguages, setEditLanguages] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLang, setOtherLang] = useState("");
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [resumeMeta, setResumeMeta] = useState<{ name: string; size: number } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // initial load
  useEffect(() => {
    if (IS_STAGING || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("assessment_sessions")
        .select("id, name, email, phone, city, languages, resume_url")
        .eq("updated_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        toast({ title: "Couldn't load profile", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const s = (data as Session | null) ?? null;
      setSession(s);
      if (s) {
        setName(s.name ?? "");
        setEmail(s.email ?? "");
        setPhone(s.phone ?? "");
        setCity(s.city ?? "");
        const langs = (s.languages ?? []) as string[];
        const known = langs.filter((l) => LANGUAGES.includes(l));
        const unknown = langs.find((l) => !LANGUAGES.includes(l));
        setLanguages(unknown ? [...known, "Other"] : known);
        setOtherLang(unknown ?? "");
        setResumePath(s.resume_url);
        if (s.resume_url) {
          const fname = s.resume_url.split("/").pop() ?? s.resume_url;
          setResumeMeta({ name: fname, size: 0 });
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const dirty = (() => {
    if (!session) return false;
    if (name !== (session.name ?? "")) return true;
    if (email !== (session.email ?? "")) return true;
    if (phone !== (session.phone ?? "")) return true;
    if (city !== (session.city ?? "")) return true;
    const finalLangs = languages.filter((l) => l !== "Other").concat(
      languages.includes("Other") && otherLang.trim() ? [otherLang.trim()] : []
    );
    const orig = (session.languages ?? []) as string[];
    if (finalLangs.length !== orig.length || finalLangs.some((l, i) => l !== orig[i])) return true;
    if (resumePath !== session.resume_url) return true;
    return false;
  })();

  const toggleLanguage = (lang: string) => {
    setLanguages((curr) => (curr.includes(lang) ? curr.filter((l) => l !== lang) : [...curr, lang]));
  };

  const handleResumeFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast({ title: "File too large", description: "Maximum size is 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const sid = session?.id ?? `user-${user?.id}`;
      const path = `${sid}_${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, { contentType: "application/pdf", upsert: false, cacheControl: "3600" });
      if (upErr) throw upErr;
      setResumePath(path);
      setResumeMeta({ name: file.name, size: file.size });
      toast({ title: "Resume uploaded", description: "Click Save Changes to apply." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const downloadResume = async () => {
    if (!resumePath) return;
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(resumePath, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Couldn't open resume", description: error?.message ?? "Try again.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const save = async () => {
    if (!session || !dirty) return;
    setSaving(true);
    const finalLangs = languages.filter((l) => l !== "Other").concat(
      languages.includes("Other") && otherLang.trim() ? [otherLang.trim()] : []
    );
    const { error } = await supabase
      .from("assessment_sessions")
      .update({
        name: name.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        languages: finalLangs,
        resume_url: resumePath,
      })
      .eq("id", session.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setSession({
      ...session,
      name: name.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
      languages: finalLangs,
      resume_url: resumePath,
    });
    setEditPersonal(false);
    setEditLanguages(false);
    toast({ title: "Profile updated" });
  };

  if (loading) {
    return (
      <CandidateLayout>
        <div style={{ color: T.dim, fontFamily: T.sans }}>Loading…</div>
      </CandidateLayout>
    );
  }

  if (!session) {
    return (
      <CandidateLayout>
        <div style={{ fontFamily: T.sans, color: T.text, maxWidth: 720 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Your profile</h1>
          <p style={{ color: T.dim, marginTop: 12 }}>
            We couldn't find an assessment session linked to your account yet. Complete the assessment to set up your profile.
          </p>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 820, fontFamily: T.sans, color: T.text, paddingBottom: 80 }}>
        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, margin: 0 }}>
            Your profile
          </h1>
          <p style={{ fontSize: 16, color: T.dim, margin: "10px 0 0" }}>Edit your candidate profile here.</p>
        </header>

        {/* Section 1: Personal Information */}
        <Card>
          <CardHeader title="Personal information" onEdit={() => setEditPersonal((v) => !v)} editing={editPersonal} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <Field label="Name" value={name} onChange={setName} editing={editPersonal} placeholder="Your full name" />
            <Field label="Email" value={email} onChange={setEmail} editing={editPersonal} placeholder="you@example.com" type="email" />
            <Field label="Phone" value={phone} onChange={setPhone} editing={editPersonal} placeholder="+91…" />
            <Field label="City" value={city} onChange={setCity} editing={editPersonal} placeholder="City" />
          </div>
        </Card>

        {/* Section 2: Languages */}
        <div style={{ marginTop: 24 }}>
          <Card>
            <CardHeader title="Languages" onEdit={() => setEditLanguages((v) => !v)} editing={editLanguages} />

            {!editLanguages ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                {(session.languages ?? []).length === 0 && (
                  <span style={{ color: T.dim, fontSize: 14 }}>No languages added yet.</span>
                )}
                {(session.languages ?? []).map((lang) => (
                  <span
                    key={lang}
                    style={{
                      padding: "8px 16px",
                      background: T.greenTint,
                      border: `1px solid ${T.green}`,
                      borderRadius: 24,
                      fontSize: 14,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
                  {LANGUAGES.map((lang) => {
                    const sel = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        style={{
                          padding: "10px 20px",
                          background: sel ? T.green : T.white,
                          border: `1px solid ${sel ? T.green : T.border}`,
                          borderRadius: 24,
                          cursor: "pointer",
                          fontFamily: T.sans,
                          fontSize: 15,
                          fontWeight: sel ? 700 : 500,
                          color: T.text,
                          transition: "all 150ms ease",
                        }}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
                {languages.includes("Other") && (
                  <input
                    type="text"
                    value={otherLang}
                    onChange={(e) => setOtherLang(e.target.value)}
                    maxLength={50}
                    placeholder="Specify other language"
                    style={{
                      marginTop: 12,
                      width: "100%",
                      maxWidth: 320,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontFamily: T.sans,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      background: T.white,
                      color: T.text,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </>
            )}
          </Card>
        </div>

        {/* Section 3: Resume */}
        <div style={{ marginTop: 24 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Resume</h2>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleResumeFile(f);
              }}
            />

            {resumeMeta ? (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 8, background: T.greenTint,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <FileText size={20} color={T.text} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {resumeMeta.name}
                  </div>
                  {resumeMeta.size > 0 && (
                    <div style={{ color: T.dim, marginTop: 2 }}>
                      {(resumeMeta.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={downloadResume}
                  style={pillBtn(T.white, T.text, T.border)}
                >
                  <Download size={14} style={{ marginRight: 6 }} />
                  Download
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={pillBtn(T.text, T.white, T.text)}
                >
                  {uploading ? "Uploading…" : "Replace resume"}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: T.dim, fontSize: 14 }}>No resume uploaded.</span>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={pillBtn(T.text, T.white, T.text)}
                >
                  <Upload size={14} style={{ marginRight: 6 }} />
                  {uploading ? "Uploading…" : "Upload resume"}
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Save bar */}
        {dirty && (
          <div
            style={{
              position: "sticky",
              bottom: 24,
              marginTop: 32,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={save}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px 10px 22px",
                background: T.text,
                color: T.white,
                border: "none",
                borderRadius: 99,
                fontFamily: T.sans,
                fontSize: 15,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                opacity: saving ? 0.85 : 1,
              }}
            >
              {saving ? "Saving…" : "Save changes"}
              <span
                style={{
                  width: 28, height: 28, borderRadius: "50%", background: T.green,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ArrowRight size={16} color={T.text} />
              </span>
            </button>
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
        background: "#fff",
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title, onEdit, editing,
}: { title: string; onEdit: () => void; editing: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: T.text }}>{title}</h2>
      <button
        type="button"
        onClick={onEdit}
        style={pillBtn(T.white, T.text, T.border)}
      >
        {editing ? <X size={14} style={{ marginRight: 6 }} /> : <Pencil size={14} style={{ marginRight: 6 }} />}
        {editing ? "Cancel" : "Edit"}
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, editing, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
        {label}
      </div>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            fontFamily: T.sans,
            color: T.text,
            background: "#fff",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <div style={{ fontSize: 15, color: value ? T.text : T.dim, padding: "8px 0" }}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function pillBtn(bg: string, fg: string, border: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: 99,
    fontFamily: T.sans,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
