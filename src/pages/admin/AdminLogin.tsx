import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { adminLogin, getAdminSession } from "@/lib/admin-auth";

const T = {
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e5e5e5",
  red: "#ef4444",
  disabled: "#9ca3af",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: T.sans,
  fontSize: 14,
  fontWeight: 500,
  color: T.text,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: 12,
  fontFamily: T.sans,
  fontSize: 14,
  color: T.text,
  outline: "none",
  boxSizing: "border-box",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminSession().then((s) => {
      if (s) navigate("/admin/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await adminLogin(email, password);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#ffffff",
        fontFamily: T.sans,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#ffffff",
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 48,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontFamily: T.sans,
            fontSize: 32,
            fontWeight: 700,
            color: T.text,
            textAlign: "center",
            margin: 0,
          }}
        >
          Crarity Admin
        </h1>
        <p
          style={{
            fontFamily: T.sans,
            fontSize: 16,
            color: T.dim,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          Sign in to your account
        </p>

        <form onSubmit={handleLogin} style={{ marginTop: 40 }}>
          <div>
            <label htmlFor="admin-email" style={labelStyle}>Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <label htmlFor="admin-password" style={labelStyle}>Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                color: T.red,
                fontFamily: T.sans,
                fontSize: 14,
                marginTop: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 32,
              width: "100%",
              padding: "14px 20px",
              borderRadius: 999,
              border: "none",
              background: loading ? T.disabled : T.text,
              color: "#ffffff",
              fontFamily: T.sans,
              fontSize: 16,
              fontWeight: 500,
              cursor: loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              transition: "background 150ms",
            }}
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            {!loading && (
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: T.green,
                  color: T.text,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
