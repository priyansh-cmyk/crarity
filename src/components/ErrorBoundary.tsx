import React from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

const T = {
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  green: "#C5E831",
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to Supabase error_logs (best-effort, don't block UI)
    supabase.from("error_logs").insert({
      error_type: "react_boundary",
      error_message: error.message,
      error_stack: error.stack,
      context: {
        componentStack: info.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    }).then(() => {}).catch(() => {});

    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f6f3",
        fontFamily: T.sans,
        padding: 24,
      }}>
        <div style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: T.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 28,
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: T.dim, lineHeight: 1.6, margin: "0 0 32px" }}>
            An unexpected error occurred. Your progress has been saved — refresh to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: T.text,
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 99,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.sans,
            }}
          >
            Refresh page
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, textAlign: "left" }}>
              <summary style={{ fontSize: 12, color: T.dim, cursor: "pointer" }}>Error details</summary>
              <pre style={{
                fontSize: 11,
                color: T.dim,
                marginTop: 8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                background: "#f7f6f3",
                padding: 12,
                borderRadius: 8,
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
