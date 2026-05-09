import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";
import MobileBlockOverlay, { isMobileDevice } from "@/components/MobileBlockOverlay";
import logoAllen from "@/assets/logo-allen.png";
import logoAppseconnect from "@/assets/logo-appseconnect.png";
import logoUnext from "@/assets/logo-unext.png";

const HIRING_LOGOS = [
  { src: logoAppseconnect, alt: "APPSeCONNECT" },
  { src: logoAllen, alt: "Allen" },
  { src: logoUnext, alt: "UNext" },
];

const T = {
  bg: "#ffffff",
  green: "#C5E831",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const ROLE_BULLETS = [
  "Speak with interested parents and students to understand their academic aspirations",
  "Provide guidance on courses, career pathways, and program fit",
  "Resolve concerns around curriculum, outcomes, fees, and admissions",
  "You will be working for 5-6 days/week",
];

export default function AcademicCounselorAssessment() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const [logoIndex, setLogoIndex] = useState(0);
  const [showMobileBlock, setShowMobileBlock] = useState(false);

  const handleStart = () => {
    if (isMobileDevice()) {
      setShowMobileBlock(true);
    } else {
      fadeNavigate("/assessment/academic-counselor/about");
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      setLogoIndex((i) => (i + 1) % HIRING_LOGOS.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {showMobileBlock && <MobileBlockOverlay onClose={() => setShowMobileBlock(false)} />}
      <div
        className="ac-page"
        style={{
          height: "100vh",
          background: T.bg,
          fontFamily: T.sans,
          color: T.text,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 40px 120px",
          boxSizing: "border-box",
          overflow: "hidden",
          ...pageStyle,
        }}
      >
        <style>{`
        .ac-headline { font-size: 72px; line-height: 1.05; }
        .ac-sub { font-size: 20px; }
        .ac-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; max-width: 1000px; width: 100%; }
        .ac-col-heading { font-size: 24px; font-weight: 500; color: ${T.text}; margin: 0 0 20px; letter-spacing: -0.01em; }
        .ac-cta { padding: 14px 14px 14px 36px; font-size: 18px; }
        @media (max-width: 768px) {
          .ac-page { height: auto !important; min-height: 100vh; padding: 88px 20px 100px !important; overflow: visible !important; justify-content: flex-start !important; }
          .ac-headline { font-size: 32px; line-height: 1.2; }
          .ac-sub { font-size: 16px; max-width: 90% !important; margin-bottom: 32px !important; }
          .ac-grid { grid-template-columns: 1fr; gap: 32px; }
          .ac-col-heading { text-align: center; }
          .ac-cta-wrap { width: 100% !important; margin-top: 32px !important; }
          .ac-cta { width: 100% !important; justify-content: space-between !important; padding: 14px 14px 14px 24px !important; font-size: 16px !important; }
          .ac-footer { position: static !important; margin-top: 48px; padding: 0 16px; }
        }
      `}</style>

        {/* Brand mark */}
        <div
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

        {/* Decorative sparkle - top right */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
          style={{ position: "absolute", top: 110, right: 80, opacity: 0.18, pointerEvents: "none" }}
        >
          <path d="M30 6 L 33 27 L 54 30 L 33 33 L 30 54 L 27 33 L 6 30 L 27 27 Z" fill={T.green} />
        </svg>

        {/* Decorative squiggle arrow - bottom left */}
        <svg
          width="120"
          height="60"
          viewBox="0 0 120 60"
          fill="none"
          style={{ position: "absolute", bottom: 90, left: 60, opacity: 0.18, pointerEvents: "none" }}
        >
          <path d="M6 50 Q 30 10, 60 30 T 110 20" stroke={T.green} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path
            d="M102 14 L 112 20 L 106 28"
            stroke={T.green}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Headline + wavy underline */}
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <h1
            className="ac-headline"
            style={{
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              color: T.text,
              textAlign: "center",
            }}
          >
            Academic Counselor
          </h1>
          <svg
            width="105%"
            height="14"
            viewBox="0 0 480 14"
            preserveAspectRatio="none"
            style={{ display: "block", marginTop: 8 }}
          >
            <path
              d="M2 8 Q 30 1, 60 7 T 120 7 T 180 7 T 240 7 T 300 7 T 360 7 T 420 7 T 478 7"
              stroke={T.green}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p
          className="ac-sub"
          style={{
            fontWeight: 400,
            color: T.dim,
            lineHeight: 1.6,
            margin: "0 0 48px",
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          Play this game that shows what you can actually do and if you score well - you get matched with companies that
          are actively hiring
        </p>

        {/* Two-column section */}
        <div className="ac-grid">
          {/* Left: What you'll do */}
          <div>
            <div className="ac-col-heading">What you'll do</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {ROLE_BULLETS.map((b) => (
                <li
                  key={b}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    fontSize: 18,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: T.text,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: T.green,
                      marginTop: 10,
                      flexShrink: 0,
                    }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Who's hiring */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <div className="ac-col-heading" style={{ textAlign: "center", marginBottom: 24 }}>
              Who's hiring
            </div>
            <div
              style={{
                position: "relative",
                height: 36,
                width: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {HIRING_LOGOS.map((logo, i) => (
                <img
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    height: 36,
                    width: "auto",
                    filter: "grayscale(100%)",
                    opacity: i === logoIndex ? 0.85 : 0,
                    transition: "opacity 0.3s ease-in-out",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 16,
                fontWeight: 400,
                color: T.dim,
                textAlign: "center",
              }}
            >
              + many other edtech companies
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="ac-cta-wrap"
          style={{ marginTop: 48, display: "flex", justifyContent: "center", width: "auto" }}
        >
          <button
            className="ac-cta"
            onClick={handleStart}
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
            Got it, let's move
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

        {/* Footer email */}
        <div
          className="ac-footer"
          style={{
            position: "absolute",
            bottom: 20,
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
    </>
  );
}
