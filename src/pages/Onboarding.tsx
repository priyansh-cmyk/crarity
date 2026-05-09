import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Upload, X, MapPin, IndianRupee, FileText, School, GraduationCap, FlaskConical, Laptop } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ================================ Tokens =============================== */
const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaa",
  border: "#e8e3d8",
  borderSoft: "#f3f1ec",
  green: "#C5E831",
  greenSoft: "rgba(197, 232, 49, 0.12)",
  greenSelectedBg: "rgba(197, 232, 49, 0.03)",
  cream: "#fffef9",
};
const ease = "cubic-bezier(0.4, 0, 0.2, 1)";

/* ================================ Doodles ============================== */
const HeadsetDoodle = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#1a1a1a"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 16c0-4.2 3.3-7.6 7.4-7.6 4 0 7.2 3.3 7.1 7.3" />
    <path d="M14.5 18c.6 1.4 2 2.3 3.6 2.2 1.5-.1 2.7-.9 3.3-2" />
    <path d="M9.4 17.5C9.6 12 13.5 7.6 18.5 7.5c5.1-.1 9 4.2 9.1 9.7" />
    <path d="M8.6 17.2c-.7.1-1.2.7-1.2 1.5l.1 3.5c0 .9.7 1.6 1.6 1.5l1.6-.1-.2-6.5-1.9.1z" />
    <path d="M27.6 16.8c.8 0 1.4.6 1.5 1.4l.2 3.5c0 .9-.6 1.6-1.5 1.7l-1.6.1-.3-6.5 1.7-.2z" />
    <path d="M27 22.5c.1 1.6-.5 3-1.7 4-.8.6-1.9 1-3 1.1l-2.8.1" />
    <circle cx="19.2" cy="27.8" r="1.1" />
  </svg>
);
const HandshakeDoodle = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#1a1a1a"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18c2.3-.4 4.6-.3 6.8.4" />
    <path d="M9.8 18.4c1.2.4 2.3 1 3.3 1.9l3.5 3c.7.6 1.7.6 2.4-.1.7-.8.6-2-.2-2.6l-2.6-2.2" />
    <path d="M16.2 18.4c1.4-1.6 3.5-2.5 5.7-2.4 1.4 0 2.7.5 3.7 1.4l1.7 1.5" />
    <path d="M19.5 22.4l1.6 1.4c.7.6 1.8.5 2.4-.2.7-.7.6-1.9-.1-2.6l-1.4-1.2" />
    <path d="M22.4 24.4l1 .9c.7.6 1.8.5 2.4-.2.7-.7.6-1.8-.1-2.5" />
    <path d="M27.4 18.9c2.1-.6 4.4-.7 6.6-.4" />
    <path d="M14 12.5l1.2.8M22 12.5l-1.2.8" />
  </svg>
);
const MegaphoneDoodle = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#1a1a1a"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 17.8c0-.6.5-1.1 1.1-1.2l13.6-3.4c.7-.2 1.3.3 1.3 1l.4 9.8c0 .8-.7 1.3-1.4 1l-13.4-4.5c-.5-.2-.8-.7-.9-1.2l-.7-1.5z" />
    <path d="M23.7 15.4l3.6-1.1c.6-.2 1.2.2 1.3.8l.6 6.6c0 .6-.5 1.1-1.1 1.1l-3.5-.2" />
    <path d="M11.4 21.3l-1.2 4.4c-.2.9.5 1.7 1.4 1.6l1.7-.2c.7-.1 1.2-.7 1.1-1.4l-.6-3.4" />
    <path d="M30.5 12.5c1 1 1.6 2.4 1.6 3.9M30.6 19c1.1-.8 1.8-2 1.9-3.4M27.6 26c.5 1.4.4 3-.4 4.3" strokeWidth="2" />
  </svg>
);

/* ================================ Data ================================== */
type RoleKey = "academic_counselor" | "inside_sales" | "bdr";
const ROLES: Array<{ key: RoleKey; name: string; description: string; Doodle: () => JSX.Element }> = [
  { key: "academic_counselor", name: "Academic Counselor", description: "Handle parent calls, student counseling, and enrollment planning", Doodle: HeadsetDoodle },
  { key: "inside_sales", name: "Inside Sales", description: "Close deals, negotiate contracts, and manage client relationships", Doodle: HandshakeDoodle },
  { key: "bdr", name: "BDR", description: "Generate leads, cold outreach, and build sales pipeline", Doodle: MegaphoneDoodle },
];
const ROLE_LABEL: Record<RoleKey, string> = {
  academic_counselor: "Academic Counselor",
  inside_sales: "Inside Sales",
  bdr: "BDR",
};

const LOCATIONS = ["Bangalore", "Remote", "Bangalore / Remote"] as const;
const TIMELINES = ["ASAP", "Within 2 weeks", "Within a month"] as const;
type LocationOpt = (typeof LOCATIONS)[number];
type TimelineOpt = (typeof TIMELINES)[number];

type CountState = { status: "loading" } | { status: "ok"; n: number } | { status: "error" };

const DEMO_CANDIDATES = [
  { name: "Aarav Mehta", score: 95, location: "Bangalore", date: "Apr 20, 2026" },
  { name: "Priya Nair", score: 93, location: "Mumbai", date: "Apr 20, 2026" },
  { name: "Rohan Iyer", score: 92, location: "Delhi", date: "Apr 19, 2026" },
  { name: "Sana Kapoor", score: 91, location: "Pune", date: "Apr 19, 2026" },
  { name: "Arjun Singh", score: 90, location: "Hyderabad", date: "Apr 18, 2026" },
  { name: "Sneha Sharma", score: 89, location: "Chennai", date: "Apr 18, 2026" },
  { name: "Kavya Patel", score: 88, location: "Bangalore", date: "Apr 17, 2026" },
  { name: "Aditya Kumar", score: 87, location: "Delhi", date: "Apr 17, 2026" },
  { name: "Ishaan Verma", score: 86, location: "Mumbai", date: "Apr 16, 2026" },
  { name: "Meera Reddy", score: 85, location: "Hyderabad", date: "Apr 16, 2026" },
  { name: "Riya Gupta", score: 84, location: "Pune", date: "Apr 15, 2026" },
  { name: "Vikram Joshi", score: 82, location: "Chennai", date: "Apr 15, 2026" },
];

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "8+ characters").max(72).regex(/\d/, "Needs a number"),
  company: z.string().trim().max(120).optional(),
});

/* ============================== Component ============================== */
const Onboarding = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  // Page-level enter animation (fade + subtle upward slide) to match landing→onboarding transition
  const [pageMounted, setPageMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setPageMounted(true), 100);
    return () => window.clearTimeout(t);
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayStep, setDisplayStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Education segment selection (replaces role selection)
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>("academic_counselor");
  const [hoverRole, setHoverRole] = useState<RoleKey | null>(null);
  const [educationSegment, setEducationSegment] = useState<string | null>(null);
  const [hoverSegment, setHoverSegment] = useState<string | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);
  const [customSegment, setCustomSegment] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);
  const [counts, setCounts] = useState<Record<RoleKey, CountState>>({
    academic_counselor: { status: "loading" },
    inside_sales: { status: "loading" },
    bdr: { status: "loading" },
  });
  const [showContinue, setShowContinue] = useState(false);

  // Step 2 — progressive 4-section form
  const [s2Section, setS2Section] = useState<1 | 2 | 3 | 4>(1);
  const [location, setLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jdTab, setJdTab] = useState<"upload" | "paste">("upload");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdSkipped, setJdSkipped] = useState(false);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [hoverTimeline, setHoverTimeline] = useState<string | null>(null);
  const [positions, setPositions] = useState("1");
  // Derived selLoc/selTime kept for Step 3 query compatibility
  const selLoc = useMemo(() => {
    const v = location.toLowerCase();
    if (!v) return null;
    if (v.includes("bangalore") || v.includes("bengaluru") || v.includes("koramangala")) return "Bangalore" as const;
    return null;
  }, [location]);
  const selTime = timeline;

  // Step 3
  const [candidates, setCandidates] = useState<typeof DEMO_CANDIDATES | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalIn, setModalIn] = useState(false);

  // Loading overlay between Step 2 and Step 3
  const [showLoader, setShowLoader] = useState(false);
  const [loaderOut, setLoaderOut] = useState(false);
  const [loaderCount, setLoaderCount] = useState(0);
  const [loaderTextIdx, setLoaderTextIdx] = useState(0); // 0,1,2
  const [loaderTextIn, setLoaderTextIn] = useState(true);

  const startFindCandidates = () => {
    setLoaderCount(0);
    setLoaderTextIdx(0);
    setLoaderTextIn(true);
    setLoaderOut(false);
    setShowLoader(true);
  };

  // Counter animation: 0 → 2847 over 12s with ease-in-out
  useEffect(() => {
    if (!showLoader) return;
    const target = 2847;
    const duration = 12000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-in-out cubic: slow → fast → slow
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setLoaderCount(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showLoader]);

  // Text progression with fade transitions, then advance to step 3
  useEffect(() => {
    if (!showLoader) return;
    const timers: number[] = [];
    const swap = (idx: number) => {
      setLoaderTextIn(false);
      timers.push(window.setTimeout(() => {
        setLoaderTextIdx(idx);
        setLoaderTextIn(true);
      }, 300));
    };
    timers.push(window.setTimeout(() => swap(1), 5000));
    timers.push(window.setTimeout(() => swap(2), 10000));
    // After "Found 12 matches!" shows for ~3s, fade out (500ms) then go to step 3
    timers.push(window.setTimeout(() => setLoaderOut(true), 13000));
    timers.push(window.setTimeout(() => {
      setShowLoader(false);
      setStep(3);
      setDisplayStep(3);
      setPhase("in");
    }, 13500));
    return () => { timers.forEach(t => window.clearTimeout(t)); };
  }, [showLoader]);

  // Modal form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [isNarrow, setIsNarrow] = useState(typeof window !== "undefined" ? window.innerWidth < 1100 : false);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsNarrow(window.innerWidth < 1100);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Step transition: exit old (200ms, slide left) → 100ms gap → enter new (300ms, slide from right)
  const [phase, setPhase] = useState<"in" | "exiting" | "entering">("in");
  useEffect(() => {
    if (step === displayStep) return;
    setPhase("exiting");
    const swapId = window.setTimeout(() => {
      setDisplayStep(step);
      setPhase("entering");
      // next frame, animate to "in"
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("in"));
      });
    }, 300); // 200ms exit + 100ms gap
    return () => window.clearTimeout(swapId);
  }, [step, displayStep]);

  const goToStep = (next: 1 | 2 | 3) => {
    if (next === step) return;
    setSignupError(null);
    setStep(next);
  };

  // Continue button entrance after segment selection on Step 1
  const segmentReady = (educationSegment && educationSegment !== "Others") || (othersOpen && customSegment.trim().length >= 3);
  useEffect(() => {
    if (step !== 1 || !segmentReady) {
      setShowContinue(false);
      return;
    }
    const t = window.setTimeout(() => setShowContinue(true), 100);
    return () => window.clearTimeout(t);
  }, [segmentReady, step]);

  // Step 1: live candidate counts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        ROLES.map(async (r) => {
          const { data, error } = await supabase
            .from("roles")
            .select("id, candidate_roles(candidate_id)")
            .eq("role_type", r.key);
          if (error || !data) return [r.key, { status: "error" } as CountState] as const;
          const set = new Set<string>();
          for (const row of data as Array<{ candidate_roles: { candidate_id: string }[] | null }>) {
            (row.candidate_roles ?? []).forEach((cr) => set.add(cr.candidate_id));
          }
          return [r.key, { status: "ok", n: set.size } as CountState] as const;
        })
      );
      if (cancelled) return;
      setCounts((prev) => {
        const next = { ...prev };
        for (const [k, s] of results) next[k] = s;
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, []);

  // Step 3: load candidates + open modal after 1s
  useEffect(() => {
    if (step !== 3 || !selectedRole) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, candidate_roles(candidate_id, candidates(first_name, last_name, city))")
        .eq("role_type", selectedRole);
      if (cancelled) return;
      if (error) {
        toast("Using demo data", { description: "Could not load live candidates" });
        setCandidates(DEMO_CANDIDATES);
        return;
      }
      const rows: typeof DEMO_CANDIDATES = [];
      if (data) {
        for (const r of data as Array<{ candidate_roles: Array<{ candidates: { first_name: string; last_name: string; city: string | null } | null }> | null }>) {
          for (const cr of r.candidate_roles ?? []) {
            const c = cr.candidates;
            if (!c) continue;
            rows.push({
              name: `${c.first_name} ${c.last_name}`.trim(),
              score: 80 + Math.floor(Math.random() * 15),
              location: c.city ?? "—",
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            });
          }
        }
      }
      const filtered = selLoc
        ? rows.filter((r) => r.location.toLowerCase().includes(selLoc.toLowerCase()))
        : rows;
      if (filtered.length === 0) {
        toast("Using demo data", { description: "No live candidates yet for these criteria" });
        setCandidates(DEMO_CANDIDATES);
      } else {
        setCandidates(filtered.slice(0, 12));
      }
    })();
    // Header fades in (500ms) and rows stagger in; trigger signup modal as fade completes
    const tModal = window.setTimeout(() => setShowModal(true), 1400);
    return () => { cancelled = true; window.clearTimeout(tModal); };
  }, [step, selectedRole, selLoc]);

  useEffect(() => {
    if (!showModal) return;
    const id = requestAnimationFrame(() => setModalIn(true));
    return () => cancelAnimationFrame(id);
  }, [showModal]);

  // Clear inline signup error when user edits the form
  useEffect(() => {
    if (signupError) setSignupError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  /* --------------------------- Derived ---------------------------------- */
  const passwordValid = useMemo(() => {
    return {
      length: password.length >= 8,
      number: /\d/.test(password),
    };
  }, [password]);
  const emailValid = z.string().trim().email().safeParse(email).success;
  const canSubmit = emailValid && passwordValid.length && passwordValid.number && agreed && !submitting;

  /* --------------------------- Handlers --------------------------------- */
  const handleSignup = async () => {
    setSignupError(null);
    const parsed = signupSchema.safeParse({ email, password, company });
    if (!parsed.success) {
      setSignupError(parsed.error.errors[0]?.message ?? "Check your details");
      return;
    }
    if (!agreed) {
      setSignupError("Please accept the terms to continue");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, undefined, {
      company_name: company || "",
      hiring_roles: selectedRole ? ROLE_LABEL[selectedRole] : "",
      onboarding_location: selLoc ?? "",
      onboarding_timeline: selTime ?? "",
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message ?? "Could not create account";
      if (msg.includes("already registered") || msg.includes("User already registered")) {
        setSignupError("This email is already registered. Please log in instead.");
      } else if (msg.includes("Password should be at least")) {
        setSignupError("Password must be at least 6 characters long.");
      } else {
        setSignupError(msg);
      }
      return;
    }
    // Persist onboarding snapshot for the dashboard to render
    try {
      sessionStorage.setItem(
        "crarity:onboarding",
        JSON.stringify({
          roleType: selectedRole ?? "",
          roleLabel: selectedRole ? ROLE_LABEL[selectedRole] : "",
          location: location || "",
          salaryMin,
          salaryMax,
          timeline: timeline ?? "",
          positions,
          educationSegment: othersOpen ? "Others" : (educationSegment ?? ""),
          customSegment: othersOpen ? customSegment.trim() : "",
          createdAt: new Date().toISOString(),
        }),
      );
      sessionStorage.setItem("crarity:firstDashboardEntry", "1");
    } catch {
      /* ignore */
    }
    toast.success("Welcome to Crarity! 🎉");
    setModalIn(false);
    window.setTimeout(
      () => navigate("/candidates", { state: { fromSignup: true } }),
      250,
    );
  };

  /* --------------------------- Pieces ----------------------------------- */
  const stepCircle = (n: number, variant: "done" | "active" | "idle") => (
    <div
      key={n}
      style={{
        width: 44, height: 44, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: variant === "idle" ? "transparent" : T.text,
        border: variant === "idle" ? `2px solid ${T.text}` : "none",
        color: variant === "idle" ? T.text : "#fff",
        fontFamily: T.sans, fontWeight: 700, fontSize: 15, flexShrink: 0,
      }}
    >
      {variant === "done" ? <Check size={18} color="#fff" strokeWidth={3} /> : n}
    </div>
  );

  const TopBar = () => (
    <header style={{
      position: "absolute", top: 0, left: 0, right: 0, padding: `24px ${isMobile ? 20 : 40}px`,
      display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 24, color: T.text, textDecoration: "none", letterSpacing: "-0.02em" }}>
          crarity
        </Link>
        {step > 1 && step < 3 && (
          <button
            type="button"
            onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "transparent", border: "none", padding: "6px 10px",
              borderRadius: 8, cursor: "pointer",
              fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.dim,
              transition: `all 0.15s ${ease}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.dim; e.currentTarget.style.background = "transparent"; }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>
      {step < 3 && (
        <Link to="/login" style={{ fontSize: 14, color: T.text, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Login <ArrowRight size={14} />
        </Link>
      )}
    </header>
  );

  const ProgressBar = ({ current }: { current: 1 | 2 | 3 }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {stepCircle(1, current > 1 ? "done" : current === 1 ? "active" : "idle")}
        <div style={{ width: 32, height: 3, background: T.text, borderRadius: 2 }} />
        {stepCircle(2, current > 2 ? "done" : current === 2 ? "active" : "idle")}
        <div style={{ width: 32, height: 3, background: T.text, borderRadius: 2 }} />
        {stepCircle(3, current === 3 ? "active" : "idle")}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: T.text, fontWeight: 500 }}>Step {current} of 3</div>
    </div>
  );

  const renderCount = (key: RoleKey) => {
    const c = counts[key];
    if (c.status === "loading") {
      return (
        <div aria-label="Loading" style={{
          width: 120, height: 18, borderRadius: 4,
          background: "linear-gradient(90deg, #efece5 0%, #f7f5ef 50%, #efece5 100%)",
          backgroundSize: "200% 100%", animation: "crarityShimmer 1.4s ease-in-out infinite",
        }} />
      );
    }
    if (c.status === "error" || c.n === 0) return <div style={{ height: 18 }} />;
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: T.green }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: "0 0 0 3px rgba(197, 232, 49, 0.18)" }} />
        {c.n} candidates
      </div>
    );
  };

  const renderOption = <V extends string>(
    label: V, selected: V | null, hovered: V | null,
    setSelected: (v: V) => void, setHovered: (v: V | null) => void
  ) => {
    const isSel = selected === label;
    const isHov = hovered === label && !isSel;
    return (
      <button
        type="button" key={label}
        onClick={() => setSelected(label)}
        onMouseEnter={() => setHovered(label)} onMouseLeave={() => setHovered(null)}
        style={{
          height: 68, padding: 20,
          background: isSel ? T.greenSelectedBg : "#fff",
          border: isSel ? `2px solid ${T.green}` : isHov ? `1px solid ${T.text}` : `1.5px solid ${T.border}`,
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontFamily: T.sans, fontSize: 16, fontWeight: 500, color: T.text,
          boxShadow: isSel ? "0 4px 12px rgba(0, 0, 0, 0.08)" : isHov ? "0 2px 8px rgba(0, 0, 0, 0.06)" : "none",
          transition: `all 0.15s ${ease}`, width: "100%",
        }}
      >
        {label}
      </button>
    );
  };

  const PillButton = ({ label, onClick, disabled, maxWidth = 400 }: { label: string; onClick: () => void; disabled?: boolean; maxWidth?: number }) => (
    <button
      type="button" disabled={disabled} onClick={onClick}
      style={{
        width: "100%", maxWidth, height: 52,
        background: T.text, color: "#fff", border: "none", borderRadius: 999,
        fontFamily: T.sans, fontWeight: 500, fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
        boxShadow: disabled ? "none" : "0 8px 28px rgba(0,0,0,0.18)",
        transition: `all 0.18s ${ease}`,
      }}
    >
      {label}
      <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.green, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <ArrowRight size={16} color={T.text} strokeWidth={2.5} />
      </span>
    </button>
  );

  /* --------------------------- Step renderers --------------------------- */
  const headlineSize1 = isMobile ? 40 : isNarrow ? 52 : 60;
  const cardPadding = isMobile ? 22 : 24;
  const iconCircle = isMobile ? 52 : 56;

  const SEGMENTS: Array<{ key: string; title: string; description: string; Icon: typeof School }> = [
    { key: "K-12 Schools", title: "K-12 Schools", description: "CBSE, ICSE, and state board school admissions", Icon: School },
    { key: "Higher Education", title: "Higher Education", description: "Colleges, universities, and degree programs", Icon: GraduationCap },
    { key: "Test Prep (JEE/NEET)", title: "Test Prep (JEE/NEET)", description: "Coaching institutes and competitive exam prep", Icon: FlaskConical },
    { key: "Skill Development / EdTech", title: "Skill Development / EdTech", description: "Online courses, certifications, and upskilling", Icon: Laptop },
  ];

  const handleSelectSegment = (key: string) => {
    setEducationSegment(key);
    setOthersOpen(false);
    setCustomSegment("");
  };

  const handleOpenOthers = () => {
    setEducationSegment(null);
    setOthersOpen(true);
    window.setTimeout(() => customInputRef.current?.focus(), 50);
  };

  const Step1 = (
    <>
      <ProgressBar current={1} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: `40px ${isMobile ? 24 : 40}px 32px` }}>
        <h1 style={{
          fontFamily: T.sans, fontWeight: 700, fontSize: isMobile ? 36 : 52, letterSpacing: "-0.02em",
          color: T.text, textAlign: "center", margin: "0 auto 12px", maxWidth: 900, lineHeight: 1.1,
        }}>
          Which education segment?
        </h1>
        <p style={{ margin: "12px auto 0", maxWidth: 600, fontSize: 16, color: T.dim, lineHeight: 1.6, textAlign: "center" }}>
          We'll match you with counselors who know your industry
        </p>
        <div style={{
          marginTop: 40, marginLeft: "auto", marginRight: "auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, 1fr)" : "repeat(4, 280px)",
          gap: 24, justifyContent: "center",
        }}>
          {SEGMENTS.map((s) => {
            const isSel = educationSegment === s.key;
            const isHov = hoverSegment === s.key && !isSel;
            const Icon = s.Icon;
            return (
              <button
                type="button" key={s.key}
                onClick={() => handleSelectSegment(s.key)}
                onMouseEnter={() => setHoverSegment(s.key)} onMouseLeave={() => setHoverSegment(null)}
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: isSel ? `2px solid ${T.green}` : `1px solid ${isHov ? "#d0d0d0" : T.border}`,
                  borderRadius: 16, padding: 24, height: 180, width: "100%",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  transition: `all 0.15s ${ease}`,
                  fontFamily: T.sans,
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: isSel ? T.green : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: `background 0.15s ${ease}`,
                  marginLeft: -8, marginTop: -4,
                }}>
                  <Icon size={32} color={T.text} strokeWidth={1.8} />
                </div>
                <div style={{ marginTop: 12, fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>{s.title}</div>
                <div style={{ marginTop: 6, fontSize: 14, fontWeight: 400, color: T.dim, lineHeight: 1.4 }}>{s.description}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <button
            type="button"
            onClick={handleOpenOthers}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: T.sans, fontSize: 14, fontWeight: 400, color: T.dim,
              textDecoration: othersOpen ? "underline" : "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { if (!othersOpen) e.currentTarget.style.textDecoration = "none"; }}
          >
            Looking for something else?
          </button>
          {othersOpen && (
            <input
              ref={customInputRef}
              type="text"
              value={customSegment}
              onChange={(e) => setCustomSegment(e.target.value)}
              placeholder="e.g., Study abroad counseling, Music academy..."
              style={{
                width: "100%", maxWidth: 400, height: 52, padding: 16,
                border: `1px solid ${T.border}`, borderRadius: 8,
                fontFamily: T.sans, fontSize: 16, fontWeight: 400, color: T.text,
                background: "#fff", outline: "none",
                animation: `crarityOthersIn 200ms ${ease} both`,
                transition: `border-color 0.15s ${ease}`,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = T.text}
              onBlur={(e) => e.currentTarget.style.borderColor = T.border}
            />
          )}
        </div>

        {segmentReady && (
          <div style={{
            marginTop: 48, display: "flex", justifyContent: "center",
            opacity: showContinue ? 1 : 0,
            transform: showContinue ? "translateY(0)" : "translateY(20px)",
            transition: `opacity 300ms ${ease}, transform 300ms ${ease}`,
          }}>
            <PillButton label="Continue" onClick={() => goToStep(2)} />
          </div>
        )}
      </main>
    </>
  );

  const TIMELINE_OPTS: Array<{ main: string; sub?: string }> = [
    { main: "ASAP", sub: "(within 1 week)" },
    { main: "2-4 weeks" },
    { main: "Flexible", sub: "(1-2 months)" },
  ];

  const s2Progress = s2Section === 1 ? 25 : s2Section === 2 ? 50 : s2Section === 3 ? 75 : 100;
  const minNum = parseInt(salaryMin, 10);
  const maxNum = parseInt(salaryMax, 10);
  const salaryValid = Number.isFinite(minNum) && Number.isFinite(maxNum) && minNum >= 0 && maxNum > minNum;
  const salaryRangeError = salaryMin && salaryMax && Number.isFinite(minNum) && Number.isFinite(maxNum) && maxNum <= minNum
    ? "Maximum must be higher than minimum" : null;

  const handleJdFile = (file: File | null) => {
    if (!file) { setJdFile(null); return; }
    const okType = /\.(pdf|docx?|DOC|DOCX|PDF)$/.test(file.name);
    if (!okType) { toast.error("Please upload a PDF or DOC file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setJdFile(file); setJdSkipped(false);
  };

  // NOTE: Pill / PillSlot / SectionHeadline / SectionWrap are intentionally
  // plain helper FUNCTIONS (not React components defined inside the parent).
  // Defining components inside a parent re-creates their type on every render,
  // which causes React to unmount/remount the whole subtree on every keystroke.
  // That was the root cause of the input flicker and focus loss while typing.
  const renderPill = (icon: string, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 32,
      background: "#f7f6f3", border: `1px solid ${T.border}`, borderRadius: 99,
      padding: "0 12px", fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.text,
      cursor: "pointer", transition: `border-color 0.15s ${ease}`,
      maxWidth: 220, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.text; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
    >
      <span>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </button>
  );

  const pillSlotStyle: React.CSSProperties = {
    height: 60, minHeight: 60, maxHeight: 60, marginBottom: 24,
    display: "flex", flexWrap: "nowrap", gap: 8,
    justifyContent: "center", alignItems: "center",
  };

  const renderHeadline = (text: React.ReactNode, opts?: { sub?: React.ReactNode; nowrap?: boolean }) => (
    <>
      <h1 style={{
        fontFamily: T.sans, fontWeight: 700,
        fontSize: isMobile ? 32 : 44,
        letterSpacing: "-0.02em",
        color: T.text, textAlign: "center", margin: "0 auto 16px", lineHeight: 1.1,
        whiteSpace: opts?.nowrap ? "nowrap" : "normal",
      }}>
        {text}
      </h1>
      {opts?.sub && (
        <p style={{ margin: "8px auto 0", fontSize: 15, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>
          {opts.sub}
        </p>
      )}
    </>
  );

  const sectionWrapStyle = (minHeight: number): React.CSSProperties => ({
    minHeight,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    overflow: "hidden",
    willChange: "auto",
  });

  const Section1 = (
    <div style={sectionWrapStyle(400)}>
      <div style={pillSlotStyle} />
      {renderHeadline("Where will they work?")}
      <div style={{ maxWidth: 480, margin: "24px auto 0", width: "100%" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.dim, marginBottom: 10 }}>Office location</div>
        <input
          type="text"
          value={location}
          onChange={(e) => { setLocation(e.target.value); if (locationError) setLocationError(null); }}
          placeholder="e.g., 123 MG Road, Koramangala, Bangalore - 560034"
          autoFocus
          style={{
            width: "100%", height: 48, padding: "0 16px",
            border: `1px solid ${locationError ? "#dc2626" : T.border}`, borderRadius: 8,
            fontFamily: T.sans, fontSize: 16, fontWeight: 400, color: T.text, outline: "none",
            transition: `border-color 0.15s ${ease}`, background: "#fff",
          }}
          onFocus={(e) => { if (!locationError) e.currentTarget.style.borderColor = T.text; }}
          onBlur={(e) => { if (!locationError) e.currentTarget.style.borderColor = T.border; }}
        />
        <div style={{
          marginTop: 12, minHeight: 20,
          fontSize: 14, fontWeight: 400,
          color: locationError ? "#dc2626" : T.dimmer,
          textAlign: "center",
        }}>
          {locationError ?? "Be as specific as possible (include area, landmark, or pincode)"}
        </div>
      </div>
      <div style={{ marginTop: 24, minHeight: 60, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {location.trim().length >= 10 && (
          <PillButton label="Continue" onClick={() => {
            if (location.trim().length < 10) { setLocationError("Please enter a complete address"); return; }
            setS2Section(2);
          }} />
        )}
      </div>
    </div>
  );

  const Section2 = (
    <div style={sectionWrapStyle(380)}>
      <div style={pillSlotStyle}>
        {renderPill("📍", location, () => setS2Section(1))}
      </div>
      {renderHeadline("What's the salary range?")}
      <div style={{ marginTop: 20, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <div style={{ width: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 8 }}>Minimum CTC (₹/year)</div>
          <input
            type="number" min={0} value={salaryMin} placeholder="300000"
            onChange={(e) => setSalaryMin(e.target.value)}
            style={{
              width: "100%", height: 48, padding: "0 16px",
              border: `1px solid ${T.border}`, borderRadius: 8,
              fontFamily: T.sans, fontSize: 16, color: T.text, outline: "none",
              transition: `border-color 0.15s ${ease}`,
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.text}
            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
          />
        </div>
        <div style={{ width: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 8 }}>Maximum CTC (₹/year)</div>
          <input
            type="number" min={0} value={salaryMax} placeholder="500000"
            onChange={(e) => setSalaryMax(e.target.value)}
            style={{
              width: "100%", height: 48, padding: "0 16px",
              border: `1px solid ${salaryRangeError ? "#dc2626" : T.border}`, borderRadius: 8,
              fontFamily: T.sans, fontSize: 16, color: T.text, outline: "none",
              transition: `border-color 0.15s ${ease}`,
            }}
            onFocus={(e) => { if (!salaryRangeError) e.currentTarget.style.borderColor = T.text; }}
            onBlur={(e) => { if (!salaryRangeError) e.currentTarget.style.borderColor = T.border; }}
          />
        </div>
      </div>
      <div style={{ marginTop: 12, minHeight: 20, textAlign: "center", color: "#dc2626", fontSize: 14 }}>
        {salaryRangeError ?? ""}
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
        <PillButton label="Continue" onClick={() => setS2Section(3)} disabled={!salaryValid} />
      </div>
    </div>
  );

  // Format salary recap shown in pills (yearly CTC -> "₹3L - ₹5L")
  const salaryPillLabel = `₹${(minNum / 100000).toFixed(minNum % 100000 === 0 ? 0 : 1)}L - ₹${(maxNum / 100000).toFixed(maxNum % 100000 === 0 ? 0 : 1)}L`;

  const Section3 = (
    <div style={sectionWrapStyle(600)}>
      <div style={pillSlotStyle}>
        {renderPill("📍", location, () => setS2Section(1))}
        {renderPill("💰", salaryPillLabel, () => setS2Section(2))}
      </div>
      {renderHeadline("Have a job description?", { nowrap: true })}
      <p style={{ margin: "8px auto 0", fontSize: 14, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>
        (Optional but recommended for better matches)
      </p>

      <div style={{ marginTop: 20, maxWidth: 480, marginLeft: "auto", marginRight: "auto", width: "100%" }}>
        {/* Horizontal toggle, single line, always two equal buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, justifyContent: "center" }}>
          {(["upload", "paste"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setJdTab(t)} style={{
              flex: "0 0 auto", minWidth: 140, height: 36, padding: "0 18px", borderRadius: 8,
              border: jdTab === t ? `2px solid ${T.green}` : `1px solid ${T.border}`,
              background: jdTab === t ? T.greenSelectedBg : "#fff",
              color: T.text,
              fontFamily: T.sans, fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: `all 0.15s ${ease}`, whiteSpace: "nowrap",
            }}>
              {t === "upload" ? "Upload JD" : "Paste JD"}
            </button>
          ))}
        </div>

        {jdTab === "upload" ? (
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: 140, border: `2px dashed ${T.border}`, borderRadius: 12, cursor: "pointer",
            background: "#fff", transition: `background 0.15s ${ease}`, padding: 12,
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fafaf8"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
          >
            <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }}
              onChange={(e) => handleJdFile(e.target.files?.[0] ?? null)} />
            {jdFile ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FileText size={20} color={T.text} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>
                    {jdFile.name.length > 40 ? jdFile.name.slice(0, 37) + "..." : jdFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: T.dimmer, marginTop: 2 }}>{(jdFile.size / 1024).toFixed(1)} KB</div>
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); setJdFile(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} color={T.dim} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={20} color={T.dim} />
                <div style={{ marginTop: 10, fontSize: 13, color: T.dim, textAlign: "center" }}>
                  Drop PDF or DOC here, or click to browse
                </div>
              </>
            )}
          </label>
        ) : (
          <div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste your job description here..."
              style={{
                width: "100%", height: 140, padding: 12,
                border: `1px solid ${T.border}`, borderRadius: 8,
                fontFamily: T.sans, fontSize: 14, fontWeight: 400, color: T.text,
                lineHeight: 1.6, outline: "none", resize: "none",
                transition: `border-color 0.15s ${ease}`,
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = T.text}
              onBlur={(e) => e.currentTarget.style.borderColor = T.border}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: T.dimmer, textAlign: "right" }}>
              {jdText.length} characters (200+ recommended)
            </div>
          </div>
        )}

        {/* Fixed-height skip slot to prevent shift when message appears */}
        <div style={{ marginTop: 12, textAlign: "center", minHeight: 40 }}>
          <button type="button" onClick={() => { setJdSkipped(true); setS2Section(4); }}
            style={{
              background: "none", border: "none", color: T.dim, fontSize: 13,
              cursor: "pointer", textDecoration: "none", fontFamily: T.sans, padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            Skip for now
          </button>
          {jdSkipped && (
            <div style={{ marginTop: 6, fontSize: 12, color: T.dim, fontStyle: "italic" }}>
              We'll use standard requirements for {selectedRole ? ROLE_LABEL[selectedRole] : "this role"}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
        <PillButton label="Continue" onClick={() => setS2Section(4)} />
      </div>
    </div>
  );

  const Section4 = (
    <div style={sectionWrapStyle(480)}>
      <div style={pillSlotStyle}>
        {renderPill("📍", location, () => setS2Section(1))}
        {renderPill("💰", salaryPillLabel, () => setS2Section(2))}
        {(jdFile || jdText.length > 0) &&
          renderPill("📄", jdFile ? "JD uploaded" : "JD pasted", () => setS2Section(3))}
      </div>
      {renderHeadline("When do you need to hire?", { nowrap: true })}

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
        {TIMELINE_OPTS.map((opt) => {
          const isSel = timeline === opt.main;
          const isHov = hoverTimeline === opt.main && !isSel;
          return (
            <button key={opt.main} type="button"
              onClick={() => setTimeline(opt.main)}
              onMouseEnter={() => setHoverTimeline(opt.main)}
              onMouseLeave={() => setHoverTimeline(null)}
              style={{
                minHeight: 64, padding: 16,
                background: isSel ? T.greenSelectedBg : "#fff",
                border: isSel ? `2px solid ${T.green}` : isHov ? `1px solid ${T.text}` : `1.5px solid ${T.border}`,
                borderRadius: 12,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontFamily: T.sans, color: T.text,
                boxShadow: isSel ? "0 4px 12px rgba(0,0,0,0.08)" : isHov ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: `all 0.15s ${ease}`,
              }}>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{opt.main}</div>
              {opt.sub && (
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 400, color: T.dimmer }}>
                  {opt.sub}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.dim, marginBottom: 10 }}>How many people?</div>
        <select value={positions} onChange={(e) => setPositions(e.target.value)}
          style={{
            width: 200, height: 48, padding: "0 16px",
            border: `1px solid ${T.border}`, borderRadius: 8,
            fontFamily: T.sans, fontSize: 16, fontWeight: 400, color: T.text,
            background: "#fff", cursor: "pointer", outline: "none",
          }}>
          {["1", "2", "3", "4", "5", "10+"].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
        <PillButton label="Find candidates" onClick={startFindCandidates} disabled={!timeline} />
      </div>
    </div>
  );

  const Step2 = (
    <>
      <ProgressBar current={2} />
      <div style={{ maxWidth: 680, margin: "16px auto 0", padding: `0 ${isMobile ? 24 : 40}px` }}>
        <div style={{ height: 4, background: T.borderSoft, borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${s2Progress}%`, height: "100%", background: T.text,
            transition: `width 400ms ${ease}`,
          }} />
        </div>
      </div>
      <main style={{ maxWidth: 680, margin: "0 auto", padding: `24px ${isMobile ? 24 : 40}px 24px` }}>
        {/* keyed wrapper: animation runs ONLY when s2Section changes,
            never when typing in an input. */}
        <div key={`s2-${s2Section}`} style={{ animation: `crarityS2In 300ms ${ease} both` }}>
          {s2Section === 1 && Section1}
          {s2Section === 2 && Section2}
          {s2Section === 3 && Section3}
          {s2Section === 4 && Section4}
        </div>
      </main>
    </>
  );

  /* ----------------------------- Step 3 --------------------------------- */
  const criteriaText = `${selectedRole ? ROLE_LABEL[selectedRole] : "—"} - Start Hiring`;
  const Step3 = (
    <>
      <div style={{
        background: T.cream, borderBottom: `1px solid ${T.border}`,
        padding: `${isMobile ? "20px 24px" : "24px 48px"}`,
        opacity: 0,
        animation: `crarityFadeIn 500ms ${ease} forwards`,
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: T.sans, letterSpacing: "-0.02em", marginBottom: 12 }}>
          {candidates ? `Your shortlist is ready! ${candidates.length} candidate${candidates.length === 1 ? "" : "s"} matched` : "Building your shortlist…"}
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.green, color: T.text, padding: "8px 18px", borderRadius: 99,
          fontSize: 14, fontWeight: 500, fontFamily: T.sans, letterSpacing: "-0.005em",
        }}>
          {criteriaText}
        </div>
      </div>

      <div style={{ padding: `0 ${isMobile ? 20 : 48}px`, fontFamily: T.sans }}>
        {isMobile ? (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {(candidates ?? []).map((c, i) => (
              <div
                key={c.name + i}
                style={{
                  border: `1px solid ${T.border}`, borderRadius: 12,
                  background: i === 0 ? T.cream : "#fff",
                  padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
                  opacity: 0,
                  animation: `crarityRowIn 400ms ${ease} forwards`,
                  animationDelay: `${500 + i * 150}ms`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: T.text }}>{c.name}</div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 400, color: T.dim }}>{c.location} · {c.date}</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", flexShrink: 0, marginLeft: 12 }}>
                  {c.score}
                </div>
              </div>
            ))}
            {!candidates && (
              <div style={{ padding: 24, color: T.dim, fontSize: 14 }}>Loading…</div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 24, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1.8fr .6fr 1.2fr 1fr",
              padding: "14px 20px", background: "#fff", borderBottom: `1px solid ${T.borderSoft}`,
              fontSize: 12, fontWeight: 500, color: T.dimmer, textTransform: "uppercase", letterSpacing: "0.04em",
              opacity: 0,
              animation: `craritySlideInLeft 300ms ${ease} 200ms forwards`,
            }}>
              <div>Name</div><div>Score</div><div>Location</div><div>Date</div>
            </div>
            {(candidates ?? []).map((c, i) => (
              <div
                key={c.name + i}
                style={{
                  display: "grid", gridTemplateColumns: "1.8fr .6fr 1.2fr 1fr",
                  alignItems: "center", height: 56, padding: "0 20px",
                  background: i === 0 ? T.cream : "#fff",
                  borderBottom: i === (candidates?.length ?? 0) - 1 ? "none" : `1px solid ${T.borderSoft}`,
                  transition: `background 0.15s ${ease}`,
                  opacity: 0,
                  animation: `crarityRowIn 400ms ${ease} forwards`,
                  animationDelay: `${500 + i * 80}ms`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i === 0 ? T.cream : "#fff")}
              >
                <div style={{ fontSize: 17, fontWeight: 500, color: T.text }}>{c.name}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{c.score}</div>
                <div style={{ fontSize: 15, fontWeight: 400, color: T.dim }}>{c.location}</div>
                <div style={{ fontSize: 15, fontWeight: 400, color: T.dim }}>{c.date}</div>
              </div>
            ))}
            {!candidates && (
              <div style={{ padding: 24, color: T.dim, fontSize: 14 }}>Loading…</div>
            )}
          </div>
        )}
      </div>
    </>
  );

  /* ============================== Render ================================ */
  return (
    <div style={{
      minHeight: "100vh", background: "#fff", fontFamily: T.sans, color: T.text,
      position: "relative",
      backgroundImage: "radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)",
      backgroundSize: "3px 3px",
      overflow: "hidden",
      opacity: pageMounted ? 1 : 0,
      transform: pageMounted ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 400ms ease-out, transform 400ms ease-out",
    }}>
      <style>{`
        @keyframes crarityShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes crarityS2In {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes crarityFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes craritySlideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes crarityRowIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes crarityOthersIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <TopBar />

      {/* Step content with exit-then-enter transition - centered vertically and horizontally */}
      <div
        style={{
          position: "absolute",
          inset: "72px 0 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "auto",
        }}
      >
        <div
          style={{
            opacity: phase === "in" ? 1 : 0,
            transform:
              phase === "exiting" ? "translateX(-20px)"
              : phase === "entering" ? "translateX(20px)"
              : "translateX(0)",
            transition:
              phase === "exiting"
                ? `opacity 200ms ${ease}, transform 200ms ${ease}`
                : `opacity 300ms ${ease}, transform 300ms ${ease}`,
            willChange: "opacity, transform",
            width: "100%",
          }}
        >
          {displayStep === 1 && Step1}
          {displayStep === 2 && Step2}
          {displayStep === 3 && Step3}
        </div>
      </div>

      {/* Loading overlay between Step 2 and Step 3 */}
      {showLoader && (() => {
        const texts = [
          { label: "Finding candidates...", color: T.dim, weight: 500, check: false },
          { label: "Matching your requirements...", color: T.dim, weight: 500, check: false },
          { label: "Found 12 matches!", color: "#7BAA0F", weight: 600, check: true },
        ];
        const t = texts[loaderTextIdx];
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 9999, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loaderOut ? 0 : 1, transition: `opacity 500ms ${ease}`,
              fontFamily: T.sans,
            }}
          >
            <style>{`
              @keyframes crarityPulse {
                0%, 100% { transform: scale(1); opacity: 0.1; }
                50% { transform: scale(1.15); opacity: 0.18; }
              }
              @keyframes craritySpin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* pulsing circle */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: T.green, opacity: 0.1,
                  animation: "crarityPulse 2.4s ease-in-out infinite",
                }} />
                {/* spinning arc */}
                <div style={{
                  position: "absolute", inset: 8, borderRadius: "50%",
                  border: `3px solid rgba(197,232,49,0.25)`,
                  borderTopColor: T.green,
                  animation: "craritySpin 1.6s linear infinite",
                }} />
                {/* counter */}
                <div style={{
                  position: "relative", fontFamily: T.sans, fontWeight: 700,
                  fontSize: 64, color: T.text, letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {loaderCount.toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{
                marginTop: 24, height: 28,
                display: "flex", alignItems: "center", gap: 8,
                opacity: loaderTextIn ? 1 : 0,
                transition: `opacity 300ms ${ease}`,
                fontSize: 18, fontWeight: t.weight, color: t.color,
              }}>
                {t.check && <Check size={18} color={T.green} strokeWidth={3} />}
                <span>{t.label}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            opacity: modalIn ? 1 : 0, transition: `opacity 300ms ${ease}`,
          }}
        >
          <div
            role="dialog" aria-modal="true"
            style={{
              width: "100%", maxWidth: 460, background: "#fff", borderRadius: 20,
              padding: isMobile ? 28 : 40, boxShadow: "0 24px 80px rgba(0, 0, 0, 0.3)",
              fontFamily: T.sans, color: T.text,
              transform: modalIn ? "scale(1)" : "scale(0.95)",
              opacity: modalIn ? 1 : 0,
              transition: `transform 300ms ${ease}, opacity 300ms ${ease}`,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: T.greenSoft,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
            }}>
              <Check size={24} color={T.text} strokeWidth={3} />
            </div>
            <h2 style={{
              fontFamily: T.sans, fontWeight: 700, fontSize: 32, letterSpacing: "-0.02em",
              color: T.text, textAlign: "center", margin: "20px 0 0",
            }}>
              Create your account
            </h2>
            <p style={{ marginTop: 12, marginBottom: 0, fontSize: 16, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>
              Your shortlist is ready. Sign up to invite candidates.
            </p>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 20 }}>
              <button
                type="button"
                onClick={async () => {
                  setSignupError(null);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    setSignupError(error.message ?? "Could not sign in with Google");
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  width: "100%", height: 52, padding: "0 16px", borderRadius: 12,
                  background: "#fff", border: `1px solid ${T.border}`, cursor: "pointer",
                  fontFamily: T.sans, fontSize: 16, fontWeight: 500, color: T.text,
                  transition: `all 0.15s ${ease}`, boxShadow: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.93A9 9 0 0 0 0 9c0 1.45.35 2.83.93 4.05l3.04-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .93 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 12, color: T.dim, fontFamily: T.sans, letterSpacing: "0.04em" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>

              <ModalField
                label="Work email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@company.com"
                autoFocus
              />

              <div>
                <ModalField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  placeholder="At least 8 characters"
                />
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Check2 ok={passwordValid.length} text="8+ characters" />
                  <Check2 ok={passwordValid.number} text="One number" />
                </div>
              </div>

              <ModalField
                label={<span style={{ color: T.dimmer }}>Company (optional)</span>}
                value={company}
                onChange={setCompany}
                type="text"
                placeholder="Your company name"
              />

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: T.text, marginTop: 4 }}>
                <input
                  type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: T.text, cursor: "pointer" }}
                />
                <span>
                  I agree to <a href="#" style={{ color: T.text, textDecoration: "underline" }}>terms</a>
                  {" & "}
                  <a href="#" style={{ color: T.text, textDecoration: "underline" }}>privacy</a>
                </span>
              </label>

              {signupError && (
                <div role="alert" style={{
                  marginTop: 4, padding: "10px 12px", borderRadius: 8,
                  background: "rgba(220, 38, 38, 0.06)", border: "1px solid rgba(220, 38, 38, 0.2)",
                  color: "#b91c1c", fontSize: 13, lineHeight: 1.4,
                }}>
                  {signupError}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <PillButton label={submitting ? "Creating…" : "Create account"} onClick={handleSignup} disabled={!canSubmit} maxWidth={9999} />
              </div>

              <div style={{ marginTop: 4, textAlign: "center", fontSize: 14, color: T.dim }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: T.text, textDecoration: "underline" }}>Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --------------------------- Tiny subcomponents ------------------------- */
const ModalField = ({
  label, value, onChange, type, placeholder, autoFocus,
}: {
  label: React.ReactNode; value: string; onChange: (v: string) => void;
  type: "email" | "password" | "text"; placeholder: string; autoFocus?: boolean;
}) => {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#6b6b6b", marginBottom: 8, fontFamily: T.sans }}>{label}</div>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", height: 52, padding: 16,
          border: `1px solid ${focus ? T.text : T.border}`, borderRadius: 8,
          fontFamily: T.sans, fontSize: 15, color: T.text, outline: "none",
          transition: `border-color 0.15s ${ease}`, background: "#fff",
        }}
      />
    </div>
  );
};

const Check2 = ({ ok, text }: { ok: boolean; text: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: ok ? T.green : T.dimmer, fontFamily: T.sans, transition: `color 0.15s ${ease}` }}>
    <span style={{
      width: 16, height: 16, borderRadius: 4,
      border: `1.5px solid ${ok ? T.green : T.dimmer}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {ok && <Check size={11} color={T.green} strokeWidth={3} />}
    </span>
    {text}
  </div>
);

export default Onboarding;
