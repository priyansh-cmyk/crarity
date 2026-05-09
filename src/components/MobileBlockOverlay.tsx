import { ArrowLeft } from "lucide-react";

const T = {
  white: "#ffffff",
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

interface MobileBlockOverlayProps {
  onClose: () => void;
}

export default function MobileBlockOverlay({ onClose }: MobileBlockOverlayProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: T.white,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        fontFamily: T.sans,
        textAlign: "center",
      }}
    >
      <style>{`
        @keyframes mb-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes mb-blink { 0%,92%,100% { opacity: 1; } 96% { opacity: 0; } }
        @keyframes mb-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .mb-crown { transform-origin: center; animation: mb-bounce 2s ease-in-out infinite; }
        .mb-eye { animation: mb-blink 3s infinite; }
        .mb-smile { animation: mb-fadeIn 0.6s ease-in; }
      `}</style>

      <svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g className="mb-crown">
          <path
            d="M70 40 L80 30 L90 40 L100 30 L110 40 L115 50 L65 50 Z"
            fill="#FFD700"
            stroke={T.text}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
        <rect x="50" y="140" width="100" height="20" rx="3" fill={T.text} stroke={T.text} strokeWidth="2" />
        <rect x="60" y="60" width="80" height="80" fill={T.white} stroke={T.text} strokeWidth="2" />
        <circle className="mb-eye" cx="85" cy="90" r="3" fill={T.text} />
        <circle className="mb-eye" cx="115" cy="90" r="3" fill={T.text} />
        <path className="mb-smile" d="M 80 108 Q 100 122 120 108" stroke={T.text} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <line x1="65" y1="150" x2="135" y2="150" stroke="#ffffff" strokeWidth="1" />
      </svg>

      <h1 style={{ fontSize: 32, fontWeight: 700, color: T.text, margin: "32px 0 0", letterSpacing: "-0.02em" }}>
        Sorry!
      </h1>

      <p style={{ fontSize: 16, color: T.dim, margin: "16px 0 0", maxWidth: 320, lineHeight: 1.5 }}>
        We believe that if you want to get into corporate, you need to be doing this on a laptop :)
      </p>

      <button
        onClick={onClose}
        style={{
          marginTop: 40,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: T.green,
          color: T.text,
          border: "none",
          borderRadius: 999,
          padding: "14px 32px",
          fontSize: 16,
          fontWeight: 500,
          fontFamily: T.sans,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={16} />
        Go Back
      </button>
    </div>
  );
}

export const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
};
