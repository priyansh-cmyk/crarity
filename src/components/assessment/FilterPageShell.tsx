import { ReactNode } from "react";

export function FilterPageShell({
  question,
  subtitle,
  children,
  onContinue,
  canContinue,
  submitting,
  pageStyle,
}: {
  question: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  canContinue: boolean;
  submitting?: boolean;
  pageStyle: React.CSSProperties;
}) {
  return (
    <div
      className="fps-wrap"
      style={{
        ...pageStyle,
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily:
          'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .fps-wrap { padding: 32px 20px !important; }
          .fps-question { font-size: 22px !important; }
          .fps-subtitle { font-size: 15px !important; }
          .fps-btn { width: 100% !important; text-align: center !important; min-width: unset !important; }
        }
      `}</style>
      <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
        <h1
          className="fps-question"
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.2,
            marginBottom: subtitle ? 16 : 40,
          }}
        >
          {question}
        </h1>
        {subtitle && (
          <p
            className="fps-subtitle"
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "#6b6b6b",
              lineHeight: 1.5,
              maxWidth: 800,
              margin: "0 auto 40px",
            }}
          >
            {subtitle}
          </p>
        )}

        {children}

        {canContinue && (
          <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
            <PillButton active={false} onClick={onContinue} disabled={submitting}>
              {submitting ? "Saving..." : "Continue"}
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function PillButton({
  active,
  onClick,
  children,
  fullWidth = false,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fps-btn"
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = "#f7f6f3";
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = "#ffffff";
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "#C5E831" : "#ffffff",
        color: "#1a1a1a",
        border: `2px solid ${active ? "#C5E831" : "#1a1a1a"}`,
        borderRadius: 999,
        padding: "16px 32px",
        fontFamily: "inherit",
        fontSize: 16,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : "auto",
        minWidth: 400,
        opacity: disabled ? 0.6 : 1,
        transition: "all 150ms ease",
      }}
    >
      {children}
    </button>
  );
}
