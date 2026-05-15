import { ArrowRight, ArrowLeft } from "lucide-react";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  white: "#ffffff",
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const CHALLENGES = [
  "Pick Your Shot",
  "Say It Like You Mean It",
  "Beyond The Student",
  "Handle the Heat",
];

export default function AcademicCounselorAbout() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();

  return (
    <div
      style={{
        height: "100vh",
        background: T.white,
        fontFamily: T.sans,
        color: T.text,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 40px",
        boxSizing: "border-box",
        overflow: "hidden",
        ...pageStyle,
      }}
    >
      <style>{`
        .ab-headline { font-size: 64px; line-height: 1.0; }
        @media (max-width: 640px) {
          .ab-headline { font-size: 40px; }
          .ab-brand { left: 50% !important; transform: translateX(-50%) !important; }
          .ab-back { display: none !important; }
        }
      `}</style>

      {/* Brand mark */}
      <div
        className="ab-brand"
        style={{
          position: "absolute",
          top: 32,
          left: 40,
          fontSize: 20,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.02em",
        }}
      >
        crarity
      </div>

      {/* Back button */}
      <button
        className="ab-back"
        onClick={() => fadeNavigate("/assessment/academic-counselor")}
        style={{
          position: "absolute",
          top: 32,
          left: 130,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: T.dim,
          fontSize: 14,
          fontFamily: T.sans,
          cursor: "pointer",
          padding: 0,
        }}
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Main content */}
      <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Headline + play doodle */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center" }}>
          <h1
            className="ab-headline"
            style={{
              fontWeight: 700,
              letterSpacing: "-0.035em",
              margin: 0,
              color: T.text,
              textAlign: "center",
            }}
          >
            About this game
          </h1>
          <svg width="56" height="56" viewBox="0 0 68 68" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="34" cy="34" r="30" stroke={T.text} strokeWidth="2.5" fill={T.green} />
            <path d="M28 22 L 48 34 L 28 46 Z" fill={T.text} />
          </svg>
        </div>

        {/* Intro */}
        <p
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: T.dim,
            lineHeight: 1.6,
            margin: "20px 0 32px",
            maxWidth: 680,
            textAlign: "center",
          }}
        >
          This game takes{" "}
          <span
            style={{
              background: `${T.green}66`,
              padding: "2px 8px",
              borderRadius: 4,
              color: T.text,
              fontWeight: 500,
            }}
          >
            &lt;10 minutes
          </span>{" "}
          and it is divided into 4 different segments:
        </p>

        {/* Challenge list */}
        <ul
          style={{
            margin: "0 0 40px",
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          {CHALLENGES.map((c) => (
            <li
              key={c}
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: T.text,
                lineHeight: 1.4,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="11" fill={T.green} />
                <path d="M6 11.5 L 9.5 15 L 16 8" stroke={T.text} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        {/* What happens next */}
        <div style={{ width: "100%", maxWidth: 680 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: T.text,
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
              textAlign: "center",
            }}
          >
            What happens next
          </h2>
          <div
            style={{
              background: `${T.green}14`,
              border: `1px solid ${T.green}40`,
              borderRadius: 12,
              padding: 20,
              fontSize: 16,
              fontWeight: 400,
              color: T.text,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            If you score above our threshold, you're in! Then, companies see your score and request interviews - you pick which interviews you want and get hired :)
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => fadeNavigate("/assessment/academic-counselor/start")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              background: T.text,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "14px 14px 14px 36px",
              fontSize: 18,
              fontWeight: 500,
              fontFamily: T.sans,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 32px rgba(0,0,0,0.20)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.14)";
            }}
          >
            Start Assessment
            <span
              style={{
                width: 38,
                height: 38,
                background: T.green,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ArrowRight size={18} color={T.text} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>

      {/* Footer email */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 14,
          color: T.dim,
        }}
      >
        If you have any questions, mail us at: hellocrarity@gmail.com
      </div>
    </div>
  );
}
