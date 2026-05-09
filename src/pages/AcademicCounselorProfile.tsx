import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  white: "#ffffff",
  off: "#f7f6f3",
  uploadBg: "#fafafa",
  green: "#C5E831",
  greenTint: "#f4fadc",
  border: "#e5e5e5",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Other"];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function AcademicCounselorProfile() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const debugMode = params.get("debug") === "true";
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";

  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLang, setOtherLang] = useState("");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hoverZone, setHoverZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (debugMode) return;
    if (!sessionId) {
      toast({
        title: "Missing session",
        description: "Please restart the assessment.",
        variant: "destructive",
      });
      fadeNavigate("/assessment/academic-counselor");
    }
  }, [sessionId, fadeNavigate, debugMode]);

  const toggleLanguage = (lang: string) => {
    setLanguages((curr) =>
      curr.includes(lang) ? curr.filter((l) => l !== lang) : [...curr, lang],
    );
  };

  const finalLanguages = (): string[] => {
    const list = languages.filter((l) => l !== "Other");
    if (languages.includes("Other") && otherLang.trim()) {
      list.push(otherLang.trim());
    }
    return list;
  };

  const languagesValid =
    languages.length >= 1 &&
    (!languages.includes("Other") || otherLang.trim().length > 0);
  const resumeValid = !!resumeUrl && !uploading;
  const canSubmit = languagesValid && resumeValid && !submitting;

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "PDF only",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast({
        title: "File too large",
        description: "Maximum size is 5 MB.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const idForPath = sessionId ?? `debug-${Date.now()}`;
      const path = `${idForPath}_${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: false,
          cacheControl: "3600",
        });
      if (upErr) {
        console.error("[resume upload] storage error:", upErr);
        throw upErr;
      }
      setResumeFile(file);
      setResumeUrl(path);
      toast({ title: "Resume uploaded" });
    } catch (err: any) {
      console.error("[resume upload] failed:", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitProfile = async () => {
    if (!canSubmit) return;
    if (!sessionId) {
      // Debug mode: skip DB write
      fadeNavigate(
        `/assessment/academic-counselor/signup?${roleQs.replace(/^&/, "")}`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("assessment_sessions")
        .update({
          languages: finalLanguages(),
          resume_url: resumeUrl,
          profile_completed: true,
        })
        .eq("id", sessionId);
      if (error) throw error;
      fadeNavigate(
        `/assessment/academic-counselor/signup?session=${sessionId}${roleQs}`,
      );
    } catch (err) {
      toast({
        title: "Couldn't save your profile",
        description: "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const zoneActive = dragOver || hoverZone;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: T.sans,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        ...pageStyle,
      }}
    >
      <style>{`
        @keyframes acp-spin { to { transform: rotate(360deg); } }
        .acp-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
          align-items: start;
        }
        .acp-divider {
          width: 1px;
          background: #e5e5e5;
          align-self: stretch;
          margin: 0 64px;
        }
        .acp-divider-mobile { display: none; }
        .acp-section { min-height: 280px; display: flex; flex-direction: column; justify-content: flex-start; max-width: 440px; width: 100%; padding-top: 0; }
        .acp-section > label { margin-top: 0; line-height: 25px; }
        .acp-section-left { justify-self: end; text-align: right; }
        .acp-section-left .acp-pills { justify-content: flex-end; }
        .acp-section-right { justify-self: start; text-align: left; }
        @media (max-width: 768px) {
          .acp-grid { grid-template-columns: 1fr !important; gap: 0 !important; align-items: stretch !important; }
          .acp-section { min-height: 0 !important; display: block !important; }
          .acp-divider { display: none !important; }
          .acp-divider-mobile { display: block !important; height: 1px; background: #e5e5e5; margin: 40px 0; }
          .acp-submit { width: 100% !important; min-width: 0 !important; }
        }
        @media (max-width: 640px) {
          .acp-container { padding: 32px 24px !important; }
          .acp-heading { font-size: 32px !important; }
        }
      `}</style>

      <div
        className="acp-container"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 48, textAlign: "center" }}>
          <h1
            className="acp-heading"
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: 0,
              color: T.text,
            }}
          >
            Complete Your Profile
          </h1>
          <p
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: T.dim,
              margin: "12px 0 0",
            }}
          >
            Help us match you with the right opportunities
          </p>
        </header>

        <div className="acp-grid">

        {/* Q1: Languages */}
        <section className="acp-section acp-section-left">
          <label
            style={{
              display: "block",
              fontSize: 20,
              fontWeight: 500,
              color: T.text,
              marginBottom: 8,
            }}
          >
            Which languages are you fluent in?
          </label>
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: T.dim,
              margin: "0 0 16px",
            }}
          >
            Select all that apply
          </p>

          <div className="acp-pills" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {LANGUAGES.map((lang) => {
              const sel = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  style={{
                    padding: "12px 24px",
                    background: sel ? T.green : T.white,
                    border: `1px solid ${sel ? T.green : T.border}`,
                    borderRadius: 24,
                    cursor: "pointer",
                    fontFamily: T.sans,
                    fontSize: 16,
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
                marginTop: 16,
                width: "100%",
                padding: "12px 16px",
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
        </section>

        <div className="acp-divider" aria-hidden="true" />
        <div className="acp-divider-mobile" aria-hidden="true" />

        {/* Q2: Resume */}
        <section className="acp-section acp-section-right">
          <label
            style={{
              display: "block",
              fontSize: 20,
              fontWeight: 500,
              color: T.text,
              marginBottom: 8,
            }}
          >
            Upload your resume
          </label>
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: T.dim,
              margin: "0 0 16px",
            }}
          >
            PDF format, max 5MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />

          {!resumeFile ? (
            <div
              onMouseEnter={() => setHoverZone(true)}
              onMouseLeave={() => setHoverZone(false)}
              onDragOver={(e) => {
                if (uploading) return;
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (uploading) return;
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void handleFile(f);
              }}
              onClick={() => {
                if (uploading) return;
                fileInputRef.current?.click();
              }}
              style={{
                border: `2px dashed ${zoneActive ? T.green : T.border}`,
                background: zoneActive ? T.off : T.uploadBg,
                borderRadius: 12,
                padding: "32px 24px",
                textAlign: "center",
                cursor: uploading ? "wait" : "pointer",
                transition: "all 150ms ease",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? (
                <div
                  aria-label="Uploading"
                  style={{
                    width: 28,
                    height: 28,
                    margin: "0 auto 12px",
                    border: `3px solid ${T.border}`,
                    borderTopColor: T.green,
                    borderRadius: "50%",
                    animation: "acp-spin 700ms linear infinite",
                  }}
                />
              ) : (
                <Upload
                  size={28}
                  color={T.dim}
                  style={{ margin: "0 auto 12px", display: "block" }}
                />
              )}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: T.text,
                  marginBottom: 4,
                }}
              >
                {uploading ? "Uploading…" : "Drop your PDF here"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: T.dim,
                  marginBottom: 12,
                }}
              >
                {uploading ? "Please wait" : "or click to browse"}
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!uploading) fileInputRef.current?.click();
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: 99,
                  border: `1px solid ${T.border}`,
                  background: T.white,
                  fontFamily: T.sans,
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.text,
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                Choose file
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: T.greenTint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={18} color={T.text} />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontWeight: 600 }}>{resumeFile.name}</span>
                <span style={{ color: T.dim }}>
                  {" · "}
                  {(resumeFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <button
                onClick={removeResume}
                aria-label="Remove file"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "none",
                  background: T.off,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={14} color={T.dim} />
              </button>
            </div>
          )}
        </section>
        </div>

        {/* Submit */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            className="acp-submit"
            onClick={submitProfile}
            disabled={!canSubmit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: T.text,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              paddingLeft: 24,
              paddingRight: 8,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16,
              fontWeight: 500,
              fontFamily: T.sans,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              transition: "opacity 150ms ease",
              minWidth: 300,
              justifyContent: "center",
            }}
          >
            {submitting ? "Saving…" : "Move to Dashboard"}
            <span
              style={{
                width: 32,
                height: 32,
                background: T.green,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowRight size={16} color={T.text} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
