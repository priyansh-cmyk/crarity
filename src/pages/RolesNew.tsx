import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  FileText,
  Edit3,
  Wand2,
  Clock3,
  Upload,
  X,
  Menu,
  Plus,
  Folder,
  Users,
  Calendar,
  Search,
  Briefcase,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ============================== Tokens ================================= */
const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e0e0e0",
  green: "#C5E831",
  greenSoft: "#f8fce8",
  greenTint: "rgba(197, 232, 49, 0.12)",
  cream: "#f7f6f3",
};
const ease = "cubic-bezier(0.4, 0, 0.2, 1)";

/* ============================== Data =================================== */
const TIMELINES = [
  { key: "7d", label: "Within 7 days" },
  { key: "14d", label: "14 days" },
  { key: "30d", label: "30 days" },
  { key: "flex", label: "Flexible" },
] as const;
type TimelineKey = (typeof TIMELINES)[number]["key"];

const TIMELINE_TO_DB: Record<TimelineKey, "asap" | "2_4_weeks" | "flexible"> = {
  "7d": "asap",
  "14d": "asap",
  "30d": "2_4_weeks",
  flex: "flexible",
};

const LANGUAGES = [
  { key: "english", label: "English" },
  { key: "hindi", label: "Hindi" },
  { key: "tamil", label: "Tamil" },
  { key: "telugu", label: "Telugu" },
  { key: "kannada", label: "Kannada" },
] as const;
type LanguageKey = (typeof LANGUAGES)[number]["key"];

const STEPS = [
  {
    icon: Edit3,
    label: "STEP 1",
    title: "Fill this form",
    desc: "Share basic details about the role you're hiring for",
  },
  {
    icon: Wand2,
    label: "STEP 2",
    title: "We build your shortlist in less than 24 hours",
    desc: "Pre-screened, pre-tested candidates ready to interview",
  },
  {
    icon: Clock3,
    label: "STEP 3",
    title: "Review and schedule interviews",
    desc: "Meet qualified candidates who passed simulations",
  },
] as const;

type NavItem = { key: string; label: string; icon: LucideIcon; to: string };
type NavSection = { key: string; label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    key: "hiring",
    label: "HIRING",
    items: [
      { key: "create-role", label: "Create Role", icon: Plus, to: "/roles/create" },
      { key: "roles", label: "Roles", icon: Folder, to: "/roles" },
      { key: "candidates", label: "Candidates", icon: Users, to: "/candidates" },
      { key: "interviews", label: "Interviews", icon: Calendar, to: "/interviews" },
    ],
  },
  {
    key: "account",
    label: "ACCOUNT",
    items: [
      { key: "settings", label: "Settings", icon: SettingsIcon, to: "/settings" },
    ],
  },
];

/* ============================== Schema ================================= */
const formSchema = z
  .object({
    positions: z
      .string()
      .trim()
      .regex(/^\d+$/, "Enter a number")
      .refine((v) => Number(v) >= 1 && Number(v) <= 999, "1–999 positions"),
    location: z.string().trim().min(3, "Enter a location"),
    salaryMin: z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?$/, "Enter a number")
      .refine((v) => Number(v) > 0, "Must be > 0"),
    salaryMax: z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?$/, "Enter a number")
      .refine((v) => Number(v) > 0, "Must be > 0"),
    timeline: z.enum(["7d", "14d", "30d", "flex"], {
      errorMap: () => ({ message: "Pick a timeline" }),
    }),
    jdText: z.string().trim().max(20_000).optional(),
  })
  .refine((d) => Number(d.salaryMax) > Number(d.salaryMin), {
    message: "Max must be greater than min",
    path: ["salaryMax"],
  });

type FormErrors = Partial<Record<keyof z.infer<typeof formSchema>, string>>;

/* ============================== Page =================================== */
const RolesNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [positions, setPositions] = useState("1");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [timeline, setTimeline] = useState<TimelineKey | "">("");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [languages, setLanguages] = useState<LanguageKey[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Searching overlay + empty state
  const [isSearching, setIsSearching] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [profileCount, setProfileCount] = useState(247);
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Lock body scroll while this page is mounted
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Loop animation step with fade out → delay → fade in
  const [activeStep, setActiveStep] = useState(0);
  const [stepVisible, setStepVisible] = useState(true);
  useEffect(() => {
    const FADE = 300;
    const DELAY = 100;
    const HOLD = 2000;
    let timers: number[] = [];
    const cycle = () => {
      // fade out
      setStepVisible(false);
      timers.push(
        window.setTimeout(() => {
          setActiveStep((s) => (s + 1) % STEPS.length);
          // fade in after delay
          timers.push(
            window.setTimeout(() => setStepVisible(true), DELAY),
          );
        }, FADE),
      );
    };
    const id = window.setInterval(cycle, HOLD + FADE + DELAY + FADE);
    return () => {
      window.clearInterval(id);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const canSubmit = useMemo(
    () =>
      positions.trim() !== "" &&
      location.trim().length >= 3 &&
      salaryMin.trim() !== "" &&
      salaryMax.trim() !== "" &&
      Number(salaryMax) > Number(salaryMin) &&
      !!timeline &&
      !submitting,
    [positions, location, salaryMin, salaryMax, timeline, submitting],
  );

  const toggleLanguage = (k: LanguageKey) =>
    setLanguages((prev) =>
      prev.includes(k) ? prev.filter((l) => l !== k) : [...prev, k],
    );

  // Counter animation while searching
  useEffect(() => {
    if (!isSearching) return;
    const target = 500 + Math.floor(Math.random() * 301); // 500-800
    const id = window.setInterval(() => {
      setProfileCount((c) => {
        if (c >= target) return target;
        const step = Math.max(1, Math.floor((target - c) / 12));
        return Math.min(target, c + step);
      });
    }, 50);
    return () => window.clearInterval(id);
  }, [isSearching]);

  const handleCreate = async () => {
    const parsed = formSchema.safeParse({
      positions,
      location,
      salaryMin,
      salaryMax,
      timeline,
      jdText: jdText || undefined,
    });
    if (!parsed.success) {
      const fe: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormErrors;
        if (k && !fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!user) {
      toast.error("You need to be signed in to create a role");
      return;
    }

    setSubmitting(true);
    const { data: insertedRole, error } = await supabase
      .from("roles")
      .insert({
        user_id: user.id,
        role_type: "academic_counselor",
        is_custom: false,
        status: "open",
        custom_requirements: {
          location: parsed.data.location,
          work_mode: "office",
          salary_min: Number(parsed.data.salaryMin),
          salary_max: Number(parsed.data.salaryMax),
          timeline: TIMELINE_TO_DB[parsed.data.timeline],
          timeline_label: TIMELINES.find((t) => t.key === parsed.data.timeline)?.label,
          positions: parsed.data.positions,
          languages,
          jd_text: parsed.data.jdText ?? null,
          jd_filename: jdFile?.name ?? null,
        },
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error || !insertedRole) {
      toast.error(error?.message ?? "Could not create role");
      return;
    }

    const roleId = insertedRole.id as string;

    try {
      sessionStorage.setItem(
        "crarity:onboarding",
        JSON.stringify({
          roleType: "academic_counselor",
          roleLabel: "Academic Counselor",
          location: parsed.data.location,
          salaryMin: parsed.data.salaryMin,
          salaryMax: parsed.data.salaryMax,
          timeline:
            TIMELINES.find((t) => t.key === parsed.data.timeline)?.label ?? "",
          positions: parsed.data.positions,
          createdAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* ignore */
    }

    // Show searching overlay
    setProfileCount(247);
    setIsSearching(true);
    window.setTimeout(() => setSearchVisible(true), 20);

    window.setTimeout(async () => {
      // Look for completed academic_counselor candidates available to this employer
      const { data: matched } = await supabase
        .from("assessment_sessions")
        .select("id")
        .eq("completed", true)
        .eq("role_type", "academic_counselor")
        .limit(20);

      const count = matched?.length ?? 0;

      // Fade out
      setSearchVisible(false);
      window.setTimeout(() => {
        setIsSearching(false);
        if (count > 0) {
          toast.success(`Found ${count} qualified candidates`, {
            style: { background: T.green, color: T.text, border: "none" },
          });
          navigate(`/candidates?role=${roleId}`);
        } else {
          setShowEmptyState(true);
        }
      }, 300);
    }, 2500);
  };

  const clearErr = (k: keyof FormErrors) => {
    if (errors[k])
      setErrors((e) => {
        const n = { ...e };
        delete n[k];
        return n;
      });
  };

  const inputBase = (name: string, hasError: boolean): React.CSSProperties => ({
    height: 48,
    width: "100%",
    borderRadius: 12,
    border: `1.5px solid ${
      hasError ? "#c8332b" : focusedField === name ? T.green : T.border
    }`,
    background: "#fff",
    padding: "0 16px",
    fontFamily: T.sans,
    fontSize: 15,
    color: T.text,
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxShadow: focusedField === name ? `0 0 0 3px rgba(197,232,49,0.18)` : "none",
  });

  const inputProps = (name: string) => ({
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField((f) => (f === name ? null : f)),
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: T.sans,
    fontSize: 16,
    fontWeight: 500,
    color: T.text,
    marginBottom: 10,
    letterSpacing: "-0.01em",
  };

  /* =========== Right side — circular flow positions =========== */
  const CIRCLE = 300;
  const NODE = 80;
  const angles = [-90, 30, 150]; // 12, 4, 8 o'clock
  const radius = CIRCLE / 2;
  const positionsXY = angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: radius + radius * Math.cos(rad) - NODE / 2,
      y: radius + radius * Math.sin(rad) - NODE / 2,
    };
  });

  const SIDEBAR_W = sidebarOpen ? 240 : 56;
  const leftPadLeft = sidebarOpen ? 56 : 40;

  /* ============================== Render =============================== */
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        fontFamily: T.sans,
        color: T.text,
        display: "grid",
        gridTemplateColumns: `${SIDEBAR_W}px 1fr`,
        transition: `grid-template-columns 0.3s ${ease}`,
        background: "#fff",
      }}
    >
      <style>{`
        @keyframes crarity-pop {
          0% { transform: scale(1); }
          60% { transform: scale(1.18); }
          100% { transform: scale(1.1); }
        }
        @keyframes crarity-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .crarity-pill { transition: border-color 150ms ease-out, background 150ms ease-out !important; }
        .crarity-pill:hover:not(.is-active) {
          border-color: #d0d0d0 !important;
        }
        .crarity-form input::placeholder,
        .crarity-form textarea::placeholder { color: #b5b5b0; }
        .crarity-nav-row:hover { background: ${T.greenTint}; color: ${T.text} !important; }
      `}</style>

      {/* ========================= SIDEBAR ========================= */}
      <CollapsibleSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {/* ========================= CONTENT (split 50/50) ========================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* LEFT: FORM */}
        <div
          className="crarity-form"
          style={{
            background: T.cream,
            padding: `48px 40px 96px ${leftPadLeft}px`,
            overflowY: "auto",
            overflowX: "hidden",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            transition: `padding 0.3s ${ease}`,
          }}
        >
          <div style={{ width: "100%", maxWidth: 560 }}>
            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontFamily: T.sans,
                  fontWeight: 700,
                  fontSize: 48,
                  letterSpacing: "-0.02em",
                  color: T.text,
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Hire an Academic Counsellor
              </h1>
            </div>

            {/* Positions */}
            <Field label="How many positions are you hiring for?" error={errors.positions}>
              <input
                type="number"
                min={1}
                value={positions}
                onChange={(e) => {
                  setPositions(e.target.value);
                  clearErr("positions");
                }}
                {...inputProps("positions")}
                style={inputBase("positions", !!errors.positions)}
              />
            </Field>

            {/* Timeline */}
            <Field label="When do you need to fill this role?">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {TIMELINES.map((t) => {
                  const active = timeline === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className={`crarity-pill ${active ? "is-active" : ""}`}
                      onClick={() => setTimeline(t.key)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 24,
                        border: `1.5px solid ${active ? T.green : T.border}`,
                        background: active ? T.green : "#fff",
                        color: T.text,
                        fontFamily: T.sans,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Location */}
            <Field label="Where are you based out of?" error={errors.location}>
              <input
                type="text"
                placeholder="e.g., Koramangala, Bangalore"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  clearErr("location");
                }}
                {...inputProps("location")}
                style={inputBase("location", !!errors.location)}
              />
            </Field>

            {/* Languages */}
            <Field label="Languages required">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {LANGUAGES.map((l) => {
                  const active = languages.includes(l.key);
                  return (
                    <button
                      key={l.key}
                      type="button"
                      className={`crarity-pill ${active ? "is-active" : ""}`}
                      onClick={() => toggleLanguage(l.key)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 24,
                        border: `1.5px solid ${active ? T.green : T.border}`,
                        background: active ? T.green : "#fff",
                        color: T.text,
                        fontFamily: T.sans,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Salary */}
            <Field
              label="What's the salary range? (₹ LPA)"
              error={errors.salaryMin || errors.salaryMax}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: T.dim,
                      fontSize: 15,
                      fontFamily: T.sans,
                      pointerEvents: "none",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="e.g., 2.5"
                    value={salaryMin}
                    onChange={(e) => {
                      setSalaryMin(e.target.value);
                      clearErr("salaryMin");
                    }}
                    {...inputProps("salaryMin")}
                    style={{ ...inputBase("salaryMin", !!errors.salaryMin), padding: "0 16px 0 32px" }}
                  />
                </div>
                <span style={{ color: T.dim, fontSize: 14, fontFamily: T.sans, fontWeight: 400 }}>
                  to
                </span>
                <div style={{ position: "relative", flex: 1 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: T.dim,
                      fontSize: 15,
                      fontFamily: T.sans,
                      pointerEvents: "none",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="e.g., 4.0"
                    value={salaryMax}
                    onChange={(e) => {
                      setSalaryMax(e.target.value);
                      clearErr("salaryMax");
                    }}
                    {...inputProps("salaryMax")}
                    style={{ ...inputBase("salaryMax", !!errors.salaryMax), padding: "0 16px 0 32px" }}
                  />
                </div>
              </div>
            </Field>

            {/* Job description */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: T.sans,
                    fontSize: 16,
                    fontWeight: 500,
                    color: T.text,
                  }}
                >
                  Job description
                </span>
                <span
                  style={{
                    fontFamily: T.sans,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.dim,
                    background: "#f0f0f0",
                    padding: "2px 8px",
                    borderRadius: 4,
                    letterSpacing: "0.04em",
                  }}
                >
                  OPTIONAL
                </span>
              </div>

              {jdFile ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  <FileText size={16} color={T.text} />
                  <span style={{ flex: 1, fontSize: 14, color: T.text }}>
                    {jdFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setJdFile(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: T.dim,
                      display: "inline-flex",
                    }}
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 16px",
                      height: 44,
                      border: `1px solid ${T.border}`,
                      background: "#f9f9f9",
                      borderRadius: 12,
                      cursor: "pointer",
                      fontFamily: T.sans,
                      fontSize: 14,
                      fontWeight: 500,
                      color: T.text,
                      transition: "border-color 0.2s ease, background 0.2s ease",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#d0d0d0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.border;
                    }}
                  >
                    <Upload size={16} />
                    Upload JD
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setJdFile(f);
                      }}
                    />
                  </label>
                  <span style={{ fontSize: 12, color: T.dim }}>OR</span>
                  <textarea
                    placeholder="Paste your JD here"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    {...inputProps("jdText")}
                    style={{
                      ...inputBase("jdText", false),
                      height: "auto",
                      minHeight: 60,
                      padding: "10px 14px",
                      resize: "none",
                      lineHeight: 1.4,
                      fontSize: 14,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canSubmit}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 28,
                border: "none",
                background: T.text,
                color: "#fff",
                fontFamily: T.sans,
                fontSize: 18,
                fontWeight: 600,
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px 0 28px",
                marginTop: 24,
                transition: "transform 0.15s ease, opacity 0.2s ease",
              }}
              onMouseDown={(e) => {
                if (canSubmit) e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span>{submitting ? "Building..." : "Build my shortlist"}</span>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: T.green,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT: ANIMATION */}
        <div
          style={{
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "relative",
              width: CIRCLE,
              height: CIRCLE,
              marginBottom: 56,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px dashed #d0d0d0`,
              }}
            />
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const active = activeStep === i;
              const { x, y } = positionsXY[i];
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: NODE,
                    height: NODE,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: NODE,
                      height: NODE,
                      borderRadius: "50%",
                      background: "#fff",
                      border: `2px solid ${T.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: -2,
                        borderRadius: "50%",
                        background: T.green,
                        border: `2px solid ${T.green}`,
                        boxShadow: "0 4px 12px rgba(197,232,49,0.3)",
                        opacity: active && stepVisible ? 1 : 0,
                        transition: active
                          ? "opacity 300ms ease-in"
                          : "opacity 300ms ease-out",
                        pointerEvents: "none",
                      }}
                    />
                    <Icon
                      size={32}
                      color={T.text}
                      strokeWidth={2}
                      style={{ position: "relative", zIndex: 1 }}
                    />
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: -22,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.dim,
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", width: "min(720px, 95vw)", minHeight: 80 }}>
            <h3
              key={`title-${activeStep}`}
              style={{
                fontFamily: T.sans,
                fontSize: 24,
                fontWeight: 700,
                color: T.text,
                margin: "0 0 8px",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                animation: "crarity-fade 0.4s ease",
              }}
            >
              {STEPS[activeStep].title}
            </h3>
            <p
              key={`desc-${activeStep}`}
              style={{
                fontFamily: T.sans,
                fontSize: 14,
                fontWeight: 400,
                color: T.dim,
                lineHeight: 1.4,
                margin: 0,
                whiteSpace: "nowrap",
                animation: "crarity-fade 0.4s ease",
              }}
            >
              {STEPS[activeStep].desc}
            </p>
          </div>
        </div>
      </div>

      {/* ========================= SEARCHING OVERLAY ========================= */}
      {isSearching && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: T.cream,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: searchVisible ? 1 : 0,
            transition: "opacity 300ms ease-in-out",
            fontFamily: T.sans,
          }}
        >
          <style>{`
            @keyframes crarity-pulse {
              0%, 100% { transform: scale(1); opacity: 0.3; }
              50% { transform: scale(1.15); opacity: 1; }
            }
            @keyframes crarity-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div
            style={{
              position: "relative",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: T.green,
                animation: "crarity-pulse 1.5s ease-in-out infinite",
              }}
            />
            <div style={{ position: "relative", animation: "crarity-spin 2s linear infinite" }}>
              <Search size={24} color={T.text} strokeWidth={2.5} />
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 24,
              fontWeight: 500,
              color: T.text,
              letterSpacing: "-0.01em",
            }}
          >
            Searching for candidates...
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 16,
              fontWeight: 400,
              color: T.dim,
            }}
          >
            Reviewing {profileCount} profiles...
          </div>
        </div>
      )}

      {/* ========================= EMPTY STATE ========================= */}
      {showEmptyState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: T.cream,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: T.sans,
            animation: "crarity-fade 0.3s ease-in-out",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#ececec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Briefcase size={64} color={T.dim} strokeWidth={1.75} />
          </div>
          <h2
            style={{
              marginTop: 32,
              fontSize: 32,
              fontWeight: 700,
              color: T.text,
              letterSpacing: "-0.02em",
              textAlign: "center",
              margin: "32px 0 0",
            }}
          >
            No candidates available yet
          </h2>
          <p
            style={{
              marginTop: 16,
              fontSize: 16,
              fontWeight: 400,
              color: T.dim,
              maxWidth: 480,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Unfortunately, we don't have anyone matching your criteria right now. Give us 24 hours and we'll ping you once we have qualified candidates.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <button
              type="button"
              onClick={() => setShowEmptyState(false)}
              style={{
                height: 48,
                padding: "0 8px 0 24px",
                borderRadius: 24,
                border: "none",
                background: T.text,
                color: "#fff",
                fontFamily: T.sans,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>Back to role details</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: T.green,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={16} color={T.text} strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================== Helpers ================================ */
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 20 }}>
    <label
      style={{
        display: "block",
        fontFamily: T.sans,
        fontSize: 16,
        fontWeight: 500,
        color: T.text,
        marginBottom: 10,
        letterSpacing: "-0.01em",
      }}
    >
      {label}
    </label>
    {children}
    {error && (
      <p style={{ color: "#c8332b", fontSize: 12, marginTop: 6 }}>{error}</p>
    )}
  </div>
);

/* ============================== Sidebar ================================ */
const CollapsibleSidebar = ({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) => {
  const { pathname } = useLocation();
  const isActive = (to: string) => {
    if (to === "/roles") return pathname === "/roles";
    return pathname === to || pathname.startsWith(to + "/");
  };

  return (
    <aside
      style={{
        height: "100vh",
        background: "#fff",
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: `width 0.3s ${ease}`,
      }}
    >
      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "flex-start" : "center",
          gap: 12,
          padding: open ? "20px 20px" : "20px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: T.text,
          fontFamily: T.sans,
        }}
      >
        <Menu size={20} />
        {open && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            crarity
          </span>
        )}
      </button>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {SECTIONS.map((section) => (
          <div key={section.key} style={{ marginTop: 20 }}>
            {open && (
              <div
                style={{
                  padding: "0 20px",
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#aaaaaa",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {section.label}
              </div>
            )}
            {section.items.map((it) => {
              const active = isActive(it.to);
              const Icon = it.icon;
              return (
                <Link
                  key={it.key}
                  to={it.to}
                  className="crarity-nav-row"
                  title={!open ? it.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: open ? "10px 20px" : "12px 0",
                    paddingLeft: open ? (active ? 17 : 20) : 0,
                    justifyContent: open ? "flex-start" : "center",
                    borderLeft: open
                      ? active
                        ? `3px solid ${T.green}`
                        : "3px solid transparent"
                      : "none",
                    background: active ? T.greenTint : "transparent",
                    color: active ? T.text : T.dim,
                    fontWeight: active ? 600 : 400,
                    fontSize: 15,
                    textDecoration: "none",
                    transition: `background 0.2s ${ease}, color 0.2s ${ease}`,
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    color={active ? T.green : undefined}
                  />
                  {open && <span>{it.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default RolesNew;
