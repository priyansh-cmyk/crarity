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
};
const ease = "cubic-bezier(0.4, 0, 0.2, 1)";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden>
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.93A9 9 0 0 0 0 9c0 1.45.35 2.83.93 4.05l3.04-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .93 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

export default function CandidateLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const roleId = params.get("role_id");
  const debugMode = params.get("debug") === "true";
  const { user, signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (sessionId) {
        try {
          await supabase.rpc("link_session_to_user", { _session_id: sessionId });
        } catch {
          // ignore
        }
      }
      navigate("/candidate/dashboard", { replace: true });
    })();
  }, [user, sessionId, navigate]);

  const handleLogin = async () => {
    setError(null);
    if (debugMode) {
      toast.success("Debug: skipping auth");
      navigate("/candidate/dashboard?debug=true");
      return;
    }
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Check your details");
      return;
    }
    setSubmitting(true);
    const { error: err } = await signInWithEmail(email, password);
    setSubmitting(false);
    if (err) {
      const msg = err.message ?? "Could not sign in";
      if (msg.includes("Invalid login credentials") || msg.includes("Invalid email or password")) {
        const friendly = "No account found with this email and password. Please check your credentials or sign up.";
        toast.error(friendly);
        setError(friendly);
      } else if (msg.includes("Email not confirmed")) {
        const friendly = "Please check your email and verify your account first.";
        toast.error(friendly);
        setError(friendly);
      } else {
        toast.error(msg);
        setError(msg);
      }
      return;
    }
    toast.success("Welcome back");
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
        toast.error(error.message ?? "Could not sign in with Google");
        setError(error.message ?? "Could not sign in with Google");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not sign in with Google";
      toast.error(msg);
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const signupHref = `/assessment/academic-counselor/signup${sessionId ? `?session=${sessionId}${roleId ? `&role_id=${roleId}` : ""}` : ""}`;

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: T.sans, color: T.text, display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "24px 40px" }}>
        <Link to="/" style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 24, color: T.text, textDecoration: "none", letterSpacing: "-0.02em" }}>
          crarity
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8, textAlign: "center" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: T.dim, textAlign: "center", marginBottom: 32 }}>
            Log in to manage your profile and interview invites
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", height: 52, padding: "0 16px", borderRadius: 999,
              background: "#fff", border: `1px solid ${T.border}`, cursor: googleLoading ? "wait" : "pointer",
              fontFamily: T.sans, fontSize: 16, fontWeight: 500, color: T.text,
              transition: `all 0.15s ${ease}`, opacity: googleLoading ? 0.7 : 1,
            }}
          >
            <GoogleLogo />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 12, color: T.dim, letterSpacing: "0.04em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 8 }}>Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 8 }}>Password</div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", padding: 4, color: T.dim,
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" style={{
                padding: "10px 12px", borderRadius: 8,
                background: "rgba(220, 38, 38, 0.06)", border: "1px solid rgba(220, 38, 38, 0.2)",
                color: "#b91c1c", fontSize: 13, lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={submitting}
              style={{
                width: "100%", height: 52, borderRadius: 999,
                background: T.text, color: "#fff", border: "none", cursor: submitting ? "wait" : "pointer",
                fontFamily: T.sans, fontSize: 16, fontWeight: 600,
                transition: `all 0.15s ${ease}`, opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </div>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: T.dim }}>
            Don't have an account?{" "}
            <Link to={signupHref} style={{ color: T.text, textDecoration: "underline" }}>
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 52, padding: "0 16px", borderRadius: 12,
  background: "#fff", border: `1px solid ${T.border}`,
  fontFamily: T.sans, fontSize: 16, color: T.text, outline: "none",
  boxSizing: "border-box",
};
