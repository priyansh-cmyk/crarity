import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  cream: "#fffef9",
  green: "#C5E831",
};
const ease = "cubic-bezier(0.4, 0, 0.2, 1)";

const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden>
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.93A9 9 0 0 0 0 9c0 1.45.35 2.83.93 4.05l3.04-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .93 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

export default function CandidateSignup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const roleId = params.get("role_id");
  const debugMode = params.get("debug") === "true";
  const { user, signUp, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill email from session
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data } = await supabase
        .from("assessment_sessions")
        .select("email")
        .eq("id", sessionId)
        .maybeSingle();
      if (data?.email) {
        setEmail(data.email);
        setEmailLocked(true);
      }
    })();
  }, [sessionId]);

  // After auth, link session and redirect
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (sessionId) {
        try {
          await supabase.rpc("link_session_to_user", { _session_id: sessionId });
        } catch (e) {
          // Non-fatal — user is signed in either way.
        }
      }
      navigate("/candidate/dashboard", { replace: true });
    })();
  }, [user, sessionId, navigate]);

  const handleSignup = async () => {
    setError(null);
    if (debugMode) {
      toast.success("Debug: skipping auth");
      navigate("/candidate/dashboard?debug=true");
      return;
    }
    const parsed = schema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Check your details");
      return;
    }
    setSubmitting(true);
    const { error: err } = await signUp(email, password);
    setSubmitting(false);
    if (err) {
      const msg = err.message ?? "Could not create account";
      if (msg.includes("already registered") || msg.includes("User already registered")) {
        const friendly = "This email is already registered. Please log in instead.";
        toast.error(friendly);
        setError(friendly);
      } else if (msg.includes("Password should be at least")) {
        const friendly = "Password must be at least 6 characters long.";
        toast.error(friendly);
        setError(friendly);
      } else {
        toast.error(msg);
        setError(msg);
      }
      return;
    }
    toast.success("Account created successfully!");
  };

  const handleGoogle = async () => {
    setError(null);
    if (debugMode) {
      toast.success("Debug: skipping Google auth");
      navigate("/candidate/dashboard?debug=true");
      return;
    }
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message ?? "Could not sign up with Google");
        setError(error.message ?? "Could not sign up with Google");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not sign up with Google";
      toast.error(msg);
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginHref = `/assessment/academic-counselor/login${sessionId ? `?session=${sessionId}${roleId ? `&role_id=${roleId}` : ""}` : ""}`;

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: T.sans, color: T.text, display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "24px 40px", textAlign: "center" }}>
        <Link to="/" style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 24, color: T.text, textDecoration: "none", letterSpacing: "-0.02em" }}>
          crarity
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6, textAlign: "center" }}>
            One last step
          </h1>
          <p style={{ fontSize: 14, color: T.dim, textAlign: "center", marginBottom: 24, lineHeight: 1.55 }}>
            Log in so we can save your scores and you can always come back to check your status and interview invitations.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={googleBtn(googleLoading)}
          >
            <GoogleLogo />
            {googleLoading ? "Redirecting…" : "Sign up with Google"}
          </button>

          <Divider />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              disabled={emailLocked}
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              show={showPw}
              onToggleShow={() => setShowPw((v) => !v)}
            />
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter password"
              show={showPw}
              onToggleShow={() => setShowPw((v) => !v)}
            />

            {error && (
              <div role="alert" style={errorStyle}>{error}</div>
            )}

            <button
              type="button"
              onClick={handleSignup}
              disabled={submitting}
              style={primaryBtn(submitting)}
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </div>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: T.dim }}>
            Already have an account?{" "}
            <Link to={loginHref} style={{ color: T.text, textDecoration: "underline" }}>
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

// ---- shared components / styles ----

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 12, color: T.dim, letterSpacing: "0.04em" }}>OR</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

function Field({
  label, value, onChange, type, placeholder, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type: "email" | "text"; placeholder: string; disabled?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 8 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%", height: 52, padding: "0 16px", borderRadius: 12,
          background: disabled ? "#f5f3ee" : "#fff",
          border: `1px solid ${focus ? T.text : T.border}`,
          fontFamily: T.sans, fontSize: 16, color: disabled ? T.dim : T.text, outline: "none",
          transition: `border-color 0.15s ${ease}`,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function PasswordField({
  label, value, onChange, placeholder, show, onToggleShow,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; show: boolean; onToggleShow: () => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 8 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%", height: 52, padding: "0 48px 0 16px", borderRadius: 12,
            background: "#fff",
            border: `1px solid ${focus ? T.text : T.border}`,
            fontFamily: T.sans, fontSize: 16, color: T.text, outline: "none",
            transition: `border-color 0.15s ${ease}`,
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 4, color: T.dim,
          }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

const errorStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 8,
  background: "rgba(220, 38, 38, 0.06)", border: "1px solid rgba(220, 38, 38, 0.2)",
  color: "#b91c1c", fontSize: 13, lineHeight: 1.4,
};

function primaryBtn(loading: boolean): React.CSSProperties {
  return {
    width: "100%", height: 52, borderRadius: 999,
    background: T.text, color: "#fff", border: "none", cursor: loading ? "wait" : "pointer",
    fontFamily: T.sans, fontSize: 16, fontWeight: 600,
    transition: `all 0.15s ${ease}`, opacity: loading ? 0.7 : 1,
  };
}

function googleBtn(loading: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", height: 52, padding: "0 16px", borderRadius: 999,
    background: "#fff", border: `1px solid ${T.border}`, cursor: loading ? "wait" : "pointer",
    fontFamily: T.sans, fontSize: 16, fontWeight: 500, color: T.text,
    transition: `all 0.15s ${ease}`, opacity: loading ? 0.7 : 1,
  };
}
