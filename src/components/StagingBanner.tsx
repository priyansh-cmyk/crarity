/**
 * StagingBanner
 * Renders a sticky top bar only when VITE_APP_ENV === "staging".
 * Set that env var in Vercel → Project Settings → Environment Variables,
 * scoped to the "staging" branch only. Main/production will never see it.
 */

const IS_STAGING =
  import.meta.env.VITE_APP_ENV === "staging" ||
  (typeof window !== "undefined" &&
    (window.location.hostname.includes("staging") ||
      window.location.hostname.includes("crarity-git-staging")));

export default function StagingBanner() {
  if (!IS_STAGING) return null;

  return (
    <div
      id="staging-banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "#1a1a1a",
        color: "#C5E831",
        fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textAlign: "center",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        userSelect: "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#C5E831",
          boxShadow: "0 0 0 2px #1a1a1a, 0 0 0 3px #C5E831",
          animation: "stagingPulse 1.8s ease-in-out infinite",
        }}
      />
      STAGING — changes here won't affect production
      <a
        href="https://www.crarity.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#C5E831",
          textDecoration: "underline",
          fontSize: 11,
          opacity: 0.75,
          marginLeft: 4,
        }}
      >
        go to prod →
      </a>
      <style>{`
        @keyframes stagingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        /* Push page content below the banner so nothing is hidden under it */
        body { padding-top: 29px !important; }
      `}</style>
    </div>
  );
}
