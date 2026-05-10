import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fadeNavigate } from "@/lib/page-transition";
import logoAllen from "@/assets/logo-allen.png";
import logoAppseconnect from "@/assets/logo-appseconnect.png";
import logoUnext from "@/assets/logo-unext.png";

const T = {
  white: "#ffffff",
  off: "#f7f6f3",
  green: "#C5E831",
  border: "#e8e3d8",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaaaaa",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

// Responsive breakpoints hook
function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  });
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return bp;
}

type BtnSize = "sm" | "md" | "lg";
function BlackPillBtn({ children, size = "md" }: { children: ReactNode; size?: BtnSize }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();
  const sizes: Record<BtnSize, { fontSize: number; pl: number; pr: number; py: number; iconSize: number }> = {
    sm: { fontSize: 13, pl: 16, pr: 6, py: 6, iconSize: 26 },
    md: { fontSize: 14, pl: 20, pr: 8, py: 8, iconSize: 28 },
    lg: { fontSize: 16, pl: 28, pr: 10, py: 12, iconSize: 36 },
  };
  const s = sizes[size];
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: T.text,
        color: "#fff",
        border: "none",
        borderRadius: 99,
        paddingLeft: s.pl,
        paddingRight: s.pr,
        paddingTop: s.py,
        paddingBottom: s.py,
        fontSize: s.fontSize,
        fontWeight: 500,
        fontFamily: T.sans,
        cursor: "pointer",
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.18)" : "0 4px 16px rgba(0,0,0,0.12)",
        transform: hov ? "translateY(-1px)" : "none",
        transition: "all 0.18s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => fadeNavigate(navigate, "/onboarding")}
    >
      {children}
      <span
        style={{
          width: s.iconSize,
          height: s.iconSize,
          background: T.green,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links: Array<[string, string]> = [
    ["How it works", "#how"],
    ["Features", "#features"],
    ["FAQ", "#faq"],
  ];

  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "none",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
          height: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            height: "100%",
          }}
        >
          <a
            href="#"
            style={{
              fontFamily: T.sans,
              fontSize: 18,
              fontWeight: 700,
              color: T.text,
              letterSpacing: "-0.01em",
              textDecoration: "none",
            }}
          >
            crarity
          </a>
          <BlackPillBtn size="sm">Post a role</BlackPillBtn>
        </div>
      </div>
    );
  }
  // suppress unused warnings for desktop-only state
  void menuOpen;
  void setMenuOpen;

  return (
    <div
      style={{ position: "fixed", top: 20, left: 0, right: 0, zIndex: 200, display: "flex", justifyContent: "center" }}
    >
      <nav
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${T.border}`,
          borderRadius: 99,
          padding: "8px 8px 8px 20px",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.1)" : "0 2px 12px rgba(0,0,0,0.07)",
          transition: "box-shadow 0.3s",
          gap: 4,
        }}
      >
        <a
          href="#"
          style={{
            fontFamily: T.sans,
            fontSize: 17,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.01em",
            paddingRight: 16,
            textDecoration: "none",
          }}
        >
          crarity
        </a>
        <div style={{ width: 1, height: 20, background: T.border, marginRight: 4 }} />
        {links.map(([label, href]) => (
          <a
            key={label}
            href={href}
            style={{
              fontSize: 14,
              color: T.dim,
              padding: "6px 12px",
              borderRadius: 99,
              transition: "color 0.15s",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = T.text)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = T.dim)}
          >
            {label}
          </a>
        ))}
        <BlackPillBtn size="sm">Post a role</BlackPillBtn>
      </nav>
    </div>
  );
}

function DashboardMockup() {
  const candidates = [
    { name: "Priya Sharma", score: 94, location: "Bangalore", badge: "Top match", time: "2 days ago" },
    { name: "Arjun Mehta", score: 88, location: "Remote", badge: "Available now", time: "1 day ago" },
    { name: "Sneha Iyer", score: 85, location: "Bangalore", badge: null, time: "3 days ago" },
    { name: "Rohan Das", score: 82, location: "Hyderabad", badge: null, time: "4 days ago" },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px 16px 0 0",
        border: `1px solid ${T.border}`,
        borderBottom: "none",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fafaf8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: T.green,
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: T.text,
            }}
          >
            Academic Counselor · Bangalore
          </div>
          <span style={{ fontSize: 12, color: T.dimmer }}>Posted 10 minutes ago</span>
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
          <span style={{ background: "#f3f4f6", borderRadius: 6, padding: "4px 10px", color: T.dim }}>
            Sort by score
          </span>
          <span style={{ background: T.text, color: "#fff", borderRadius: 6, padding: "4px 12px", fontWeight: 500 }}>
            Invite to interview
          </span>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr",
          padding: "10px 20px",
          borderBottom: `1px solid ${T.border}`,
          background: "#fafaf8",
        }}
      >
        {["Candidate", "Score", "Location", "Simulation", "Action"].map((h, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: T.dimmer,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {h}
          </span>
        ))}
      </div>
      {candidates.map((c, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr",
            padding: "14px 20px",
            borderBottom: "1px solid #f3f1ec",
            alignItems: "center",
            background: i === 0 ? "#fffef9" : "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: i === 0 ? T.green : "#e8e3d8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {c.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
              {c.badge && (
                <span
                  style={{ fontSize: 11, background: T.green, borderRadius: 99, padding: "1px 8px", fontWeight: 500 }}
                >
                  {c.badge}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{c.score}</span>
            <span style={{ fontSize: 11, color: T.dimmer }}>/100</span>
          </div>
          <span style={{ fontSize: 13, color: T.dim }}>{c.location}</span>
          <span style={{ fontSize: 11, color: T.dimmer }}>{c.time}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={{
                fontSize: 12,
                border: `1px solid ${T.border}`,
                background: "#fff",
                borderRadius: 6,
                padding: "5px 10px",
                color: T.dim,
                cursor: "pointer",
                fontFamily: T.sans,
              }}
            >
              View transcript
            </button>
            {i === 0 && (
              <button
                style={{
                  fontSize: 12,
                  border: "none",
                  background: T.text,
                  color: "#fff",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.sans,
                }}
              >
                Invite
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Simplified mobile-friendly card view of top candidates
function MobileShortlistCard() {
  const candidates = [
    { name: "Priya Sharma", score: 94, location: "Bangalore", badge: "Top match" },
    { name: "Arjun Mehta", score: 88, location: "Remote", badge: "Available now" },
    { name: "Sneha Iyer", score: 85, location: "Bangalore", badge: null },
  ];
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          background: "#fafaf8",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            background: T.green,
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 600,
            color: T.text,
          }}
        >
          Academic Counselor
        </div>
        <span style={{ fontSize: 11, color: T.dimmer }}>3 candidates</span>
      </div>
      {candidates.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: i < candidates.length - 1 ? "1px solid #f3f1ec" : "none",
            background: i === 0 ? "#fffef9" : "#fff",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: i === 0 ? T.green : "#e8e3d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {c.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.name}</div>
            <div style={{ fontSize: 12, color: T.dimmer, marginTop: 2 }}>{c.location}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, lineHeight: 1 }}>{c.score}</div>
            <div style={{ fontSize: 10, color: T.dimmer, marginTop: 2 }}>/100</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const [tab, setTab] = useState(0);
  const tabs = ["Describe your role", "Shortlist in seconds", "Review", "Start hiring"];
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  return (
    <section
      style={{
        background: T.white,
        minHeight: isMobile ? "auto" : "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: isMobile ? 96 : 144,
        paddingBottom: isMobile ? 60 : 40,
        paddingLeft: isMobile ? 20 : 0,
        paddingRight: isMobile ? 20 : 0,
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 680, padding: isMobile ? "0" : "0 24px", width: "100%" }}>
        <h1 style={{ fontFamily: T.sans, color: T.text, marginBottom: isMobile ? 16 : 20, marginTop: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: isMobile ? 44 : isTablet ? 64 : 80,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: isMobile ? 1.1 : 0.95,
              color: T.text,
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
          >
            Start interviewing
          </span>
          <span
            style={{
              display: "block",
              fontSize: isMobile ? 44 : isTablet ? 64 : 80,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: isMobile ? 1.1 : 0.95,
              color: T.text,
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
          >
            candidates today.
          </span>
        </h1>

        <p
          style={{
            fontSize: isMobile ? 16 : 16,
            color: T.dim,
            lineHeight: 1.5,
            maxWidth: 460,
            margin: isMobile ? "0 auto 24px" : "0 auto 32px",
            fontWeight: 400,
          }}
        >
          Get a shortlist of top Academic Counsellors in seconds
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <BlackPillBtn size={isMobile ? "md" : "lg"}>Post a role for free →</BlackPillBtn>
        </div>



        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: isMobile ? "wrap" : "nowrap",
            marginTop: isMobile ? 28 : 40,
            width: isMobile ? "auto" : "max-content",
            marginLeft: isMobile ? 0 : "auto",
            marginRight: isMobile ? 0 : "auto",
          }}
        >
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                background: tab === i ? T.text : "rgba(255,255,255,0.7)",
                color: tab === i ? "#fff" : T.dim,
                border: `1px solid ${tab === i ? T.text : T.border}`,
                borderRadius: 99,
                padding: isMobile ? "6px 14px" : "8px 18px",
                fontSize: isMobile ? 11 : 13,
                fontWeight: 500,
                fontFamily: T.sans,
                cursor: "pointer",
                transition: "all 0.18s",
                whiteSpace: "nowrap",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        <div style={{ marginTop: 32, width: "100%", maxWidth: 460 }}>
          <MobileShortlistCard />
        </div>
      ) : (
        <div
          style={{
            marginTop: 40,
            width: "100%",
            maxWidth: 960,
            padding: isTablet ? "0 24px" : "0 40px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 100,
              background: `linear-gradient(to right, ${T.white}, transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 100,
              background: `linear-gradient(to left, ${T.white}, transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <DashboardMockup />
        </div>
      )}

      <div style={{ marginTop: isMobile ? 48 : 64, textAlign: "center", width: "100%" }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#6b6b6b", marginBottom: 16 }}>
          Used by top hiring teams in EdTech
        </p>
        <div style={{ display: "flex", gap: 40, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { src: logoAppseconnect, alt: "APPSeCONNECT", h: 40 },
            { src: logoAllen, alt: "Allen", h: 30 },
            { src: logoUnext, alt: "UNext", h: 32 },
          ].map((logo) => (
            <img
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              style={{
                maxWidth: 120,
                height: logo.h,
                width: "auto",
                objectFit: "contain",
                filter: "grayscale(100%)",
                opacity: 0.6,
                transition: "filter 0.2s, opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLImageElement).style.filter = "grayscale(0%)";
                (e.currentTarget as HTMLImageElement).style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLImageElement).style.filter = "grayscale(100%)";
                (e.currentTarget as HTMLImageElement).style.opacity = "0.6";
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogosBar() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  return (
    <section style={{ background: T.white, padding: isMobile ? "32px 20px" : "48px 24px" }}>
      <p style={{ textAlign: "center", fontSize: 14, fontWeight: 500, color: "#6b6b6b", marginBottom: 12 }}>
        Used by top hiring teams in EdTech
      </p>
      <div
        style={{
          display: "flex",
          gap: 32,
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {["APPSeCONNECT", "Allen", "UNextLearning"].map((company, i) => (
          <span
            key={company}
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#9ca3af",
              opacity: 0.8,
              order: i === 1 ? 0 : i === 0 ? -1 : 1,
            }}
          >
            {company}
          </span>
        ))}
      </div>
    </section>
  );
}

function PostMockup() {
  const navigate = useNavigate();
  const rows: Array<[string, string]> = [
    ["Role", "Academic Counselor"],
    ["Location", "Bangalore / Remote"],
    ["Start", "Within 2 weeks"],
  ];
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: T.dimmer }}>{k}</span>
          <span style={{ fontWeight: 500 }}>{v}</span>
        </div>
      ))}
      <button
        onClick={() => fadeNavigate(navigate, "/onboarding")}
        style={{
          marginTop: "auto",
          background: T.text,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px",
          fontSize: 12,
          fontWeight: 500,
          width: "100%",
          cursor: "pointer",
          fontFamily: T.sans,
        }}
      >
        Describe role
      </button>
    </div>
  );
}

function ScoreMockup() {
  const items = [
    { name: "Priya S.", score: 94 },
    { name: "Arjun M.", score: 88 },
    { name: "Sneha I.", score: 85 },
  ];
  return (
    <div
      style={{
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        height: "100%",
        justifyContent: "center",
      }}
    >
      {items.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: i === 0 ? T.green : "#e8e3d8",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {c.name[0]}
          </div>
          <span style={{ fontSize: 12, flex: 1 }}>{c.name}</span>
          <div
            style={{
              width: `${c.score - 60}%`,
              height: 4,
              background: i === 0 ? T.text : "#ddd",
              borderRadius: 2,
              minWidth: 30,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, width: 24, textAlign: "right" }}>{c.score}</span>
        </div>
      ))}
    </div>
  );
}

function HireMockup() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      <div style={{ fontSize: 11, color: T.dimmer, marginBottom: 2 }}>Interview invitation</div>
      <div style={{ fontSize: 12, fontWeight: 500 }}>To: Priya Sharma</div>
      <div
        style={{ fontSize: 12, color: T.dim, background: "#f9f7f2", borderRadius: 6, padding: "8px", lineHeight: 1.5 }}
      >
        Hi Priya, we reviewed your simulation (94/100) and would love to meet you this week...
      </div>
      <button
        style={{
          marginTop: "auto",
          background: T.text,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "6px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: T.sans,
        }}
      >
        Send invite
      </button>
    </div>
  );
}

function HowItWorks() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  const steps = [
    {
      tag: "Takes 2 minutes",
      tagBg: "rgba(0,0,0,0.12)",
      title: "Describe your role",
      body: "Let us know the location, salary, and timeline for Academic Counsellors or just simply upload your existing JD",
      mockup: <PostMockup />,
    },
    {
      tag: "Instant",
      tagBg: "rgba(0,0,0,0.12)",
      title: "We build your shortlist",
      body: "Instantly get candidates who proved their ability to do the job through simulations.",
      mockup: <ScoreMockup />,
    },
    {
      tag: "Save 3 weeks",
      tagBg: "rgba(0,0,0,0.12)",
      title: "Interview and hire",
      body: "Review the shortlist, choose who you want to interview and close the role in less than a week.",
      mockup: <HireMockup />,
    },
  ];

  return (
    <section
      id="how"
      style={{
        background: T.green,
        padding: isMobile ? "60px 20px" : isTablet ? "80px 32px" : "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: isMobile ? 36 : 56,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: T.sans,
                fontSize: isMobile ? 32 : isTablet ? 40 : "clamp(32px, 4vw, 52px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                maxWidth: 500,
                color: T.text,
              }}
            >
              Stop the 4 week hiring cycle
            </h2>
            <p style={{ fontSize: 15, color: "rgba(26,26,26,0.6)", marginTop: 12, maxWidth: 360, lineHeight: 1.6 }}>
              Watch how Crarity turns a role posting into a ready to interview shortlist.
            </p>
          </div>
          <BlackPillBtn size="md">Post a role for free</BlackPillBtn>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.5)",
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: isMobile ? "20px 20px 16px" : "28px 28px 20px" }}>
                <span
                  style={{
                    background: s.tagBg,
                    borderRadius: 99,
                    padding: "4px 12px",
                    fontSize: isMobile ? 13 : 12,
                    fontWeight: 600,
                    color: T.text,
                    display: "inline-block",
                    marginBottom: isMobile ? 12 : 16,
                  }}
                >
                  {s.tag}
                </span>
                <h3 style={{ fontSize: isMobile ? 22 : 18, fontWeight: 700, marginBottom: 8, color: T.text, lineHeight: 1.2 }}>{s.title}</h3>
                <p style={{ fontSize: isMobile ? 15 : 14, color: "rgba(26,26,26,0.65)", lineHeight: 1.5 }}>{s.body}</p>
              </div>
              <div
                style={{
                  margin: "0 16px 16px",
                  marginTop: "auto",
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  minHeight: isMobile ? 0 : 220,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {s.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShortlistFeatureMockup() {
  const rows = [
    { name: "Priya Sharma", score: 94, badge: "Top match", loc: "Bangalore" },
    { name: "Arjun Mehta", score: 88, badge: "Available now", loc: "Remote" },
    { name: "Sneha Iyer", score: 85, badge: null, loc: "Bangalore" },
  ];
  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.dimmer,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Academic Counselor · Bangalore · 3 candidates
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 0",
            borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: i === 0 ? T.green : "#e8e3d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {r.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: T.dimmer }}>{r.loc}</div>
          </div>
          {r.badge && (
            <span style={{ fontSize: 10, background: T.green, borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>
              {r.badge}
            </span>
          )}
          <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? T.text : T.dim }}>{r.score}</span>
        </div>
      ))}
    </div>
  );
}

function SimulationFeatureMockup() {
  const stats: Array<[string, string]> = [
    ["Communication", "96"],
    ["Problem solving", "91"],
    ["Role knowledge", "94"],
  ];
  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.dimmer,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Simulation transcript - Priya Sharma
      </div>
      <div
        style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}
      >
        <div style={{ fontSize: 11, color: T.dimmer, marginBottom: 4 }}>Task: Handle a parent objection call</div>
        <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
          "Thank you for your concern about the fee. Let me walk you through the EMI options and how our placement
          record compares..."
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {stats.map(([k, v]) => (
          <div
            key={k}
            style={{
              flex: 1,
              background: "#fff",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: "8px 10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>{v}</div>
            <div style={{ fontSize: 10, color: T.dimmer, lineHeight: 1.3, marginTop: 2 }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DirectFeatureMockup() {
  const steps = [
    { label: "Describe role", day: "Day 1", done: true },
    { label: "Shortlist ready", day: "Day 1", done: true },
    { label: "Send invites", day: "Day 2", done: true },
    { label: "First interview", day: "Day 3", done: false },
    { label: "Offer sent", day: "Day 7", done: false },
  ];
  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.dimmer,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Your hiring timeline
      </div>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 0",
            borderBottom: i < 4 ? "1px solid #f3f1ec" : "none",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: s.done ? T.green : "#e8e3d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {s.done && (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path
                  d="M1.5 4.5l2 2 4-4"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, flex: 1, color: s.done ? T.text : T.dimmer }}>{s.label}</span>
          <span style={{ fontSize: 11, color: T.dimmer, background: "#f3f1ec", borderRadius: 99, padding: "2px 8px" }}>
            {s.day}
          </span>
        </div>
      ))}
    </div>
  );
}

function Features() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  const features = [
    {
      eyebrow: "Instant Shortlist",
      title: "Your shortlist is ready before you finish your coffee",
      subtitle: "Get your ranked shortlist of Academic Counsellors instantly",
      body: "Traditional agencies spend weeks sourcing 2-3 candidates and leave you guessing if they can actually do the job. With Crarity, you get a complete shortlist of pre-vetted Academic Counsellors, ranked by performance so you know exactly who can deliver.",
      mockup: <ShortlistFeatureMockup />,
      flip: false,
      cta: "Get your shortlist now",
    },
    {
      eyebrow: "Simulation Scoring",
      title: "See exactly how candidates perform before you talk to them",
      subtitle: "You get objective proof",
      body: "Every candidate completes a live simulation of the actual job, so you get a complete breakdown of their performance before the interview.",
      mockup: <SimulationFeatureMockup />,
      flip: true,
      cta: "See candidate scores",
    },
    {
      eyebrow: "Direct Interviews",
      title: "From posting to first interview in the same week",
      subtitle: "Skip the recruitment agency entirely",
      body: "You describe what you need and start interviewing qualified candidates the same day. On top of that you can send invites directly from the platform to schedule interviews on your timeline, and close the role within a week.",
      mockup: <DirectFeatureMockup />,
      flip: false,
      cta: "Start interviewing now!",
    },
  ];

  return (
    <section id="features" style={{ background: T.white }}>
      {features.map((f, i) => (
        <div
          key={i}
          style={{
            paddingTop: i === 0 ? (isMobile ? 64 : 96) : undefined,
            background: T.white,
            padding: isMobile ? "48px 20px" : isTablet ? "60px 32px" : "72px 24px",
            ...(i === features.length - 1 ? { paddingBottom: isMobile ? 60 : 80 } : {}),
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 32 : isTablet ? 48 : 80,
              alignItems: "center",
              ...(!isMobile && f.flip ? { direction: "rtl" as const } : {}),
            }}
          >
            <div style={{ direction: "ltr" }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                  background: T.green,
                  borderRadius: 99,
                  padding: "3px 12px",
                  display: "inline-block",
                  marginBottom: 20,
                }}
              >
                {f.eyebrow}
              </span>
              <h3
                style={{
                  fontSize: isMobile ? 28 : isTablet ? 28 : "clamp(24px, 3vw, 36px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  marginBottom: 10,
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, color: T.dim, marginBottom: isMobile ? 16 : 20 }}>{f.subtitle}</p>
              {f.body.split("\n\n").map((para, j) => (
                <p key={j} style={{ fontSize: 15, color: T.dim, lineHeight: 1.6, marginBottom: 12 }}>
                  {para}
                </p>
              ))}
              <div style={{ marginTop: 28 }}>
                <BlackPillBtn size="md">{f.cta}</BlackPillBtn>
              </div>
            </div>
            <div style={{ direction: "ltr" }}>
              <div style={{ background: T.off, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}` }}>
                {f.mockup}
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ValueComparison() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  const withoutRows = [
    { label: "2 to 3 weeks", sub: "before agency sends candidates" },
    { label: "1 in 3 candidates work out", sub: "high rejection rate after screening" },
    { label: "Multiple interview rounds", sub: "to find out who can actually do the job" },
    { label: "44% candidate dropout", sub: "ghosting or last-minute rejections" },
  ];
  const withRows = [
    { label: "Same day shortlist", sub: "ready to interview instantly" },
    { label: "Multiple tested candidates", sub: "all scored 80+ on the actual job" },
    { label: "Know they can do the job before interview", sub: "simulation tested and proven" },
    { label: "Detailed performance breakdown", sub: "see exactly how each candidate performed" },
  ];

  return (
    <section
      style={{
        background: T.white,
        padding: isMobile ? "60px 20px" : isTablet ? "80px 32px" : "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: isMobile ? 28 : isTablet ? 36 : "clamp(28px, 4vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Replace your recruitment agency
        </h2>
        <p style={{ textAlign: "center", color: T.dim, fontSize: 16, marginBottom: isMobile ? 36 : 56 }}>
          Better quality in a fraction of the time
        </p>

        <div
          style={{
            background: T.white,
            borderRadius: 20,
            border: `1px solid ${T.border}`,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 60px 1fr",
          }}
        >
          <div style={{ padding: isMobile ? 20 : 36 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.dimmer,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: isMobile ? 16 : 24,
              }}
            >
              Without Crarity
            </div>
            {withoutRows.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: isMobile ? "12px 0" : "14px 0",
                  borderBottom: i < withoutRows.length - 1 ? `1px solid ${T.border}` : "none",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#f3d0d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#888", lineHeight: 1.3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: T.dimmer, marginTop: 2, lineHeight: 1.45 }}>{item.sub}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: isMobile ? 18 : 24, paddingTop: isMobile ? 16 : 20, borderTop: `2px solid ${T.border}` }}>
              <div style={{ fontSize: 13, color: T.dimmer }}>Total time to hire</div>
              <div style={{ fontSize: isMobile ? 32 : 36, fontWeight: 900, color: "#bbb", letterSpacing: "-0.03em", marginTop: 4 }}>
                4 weeks
              </div>
            </div>
          </div>

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: T.white, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "#1a1a1a" }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: T.text, background: T.white, padding: "8px 0", position: "relative", zIndex: 1 }}>VS</span>
            </div>
          )}

          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: 32, margin: "8px 20px" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "#1a1a1a" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text, background: T.white, padding: "0 12px", position: "relative", zIndex: 1 }}>VS</span>
            </div>
          )}

          <div
            style={{
              padding: isMobile ? 20 : 36,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 24, gap: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                With Crarity
              </div>
              <span
                style={{ background: T.green, borderRadius: 99, padding: "2px 12px", fontSize: 12, fontWeight: 600 }}
              >
                Instant
              </span>
            </div>
            {withRows.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: isMobile ? "12px 0" : "14px 0",
                  borderBottom: i < withRows.length - 1 ? "1px solid #f0ede4" : "none",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: T.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5l2 2 4-4"
                      stroke="#1a1a1a"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: T.dimmer, marginTop: 2, lineHeight: 1.45 }}>{item.sub}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: isMobile ? 18 : 24, paddingTop: isMobile ? 16 : 20, borderTop: `3px solid ${T.green}` }}>
              <div style={{ fontSize: 13, color: T.dim }}>Total time to hire</div>
              <div style={{ fontSize: isMobile ? 32 : 36, fontWeight: 900, color: T.text, letterSpacing: "-0.03em", marginTop: 4 }}>
                &lt;1 week
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "What roles does Crarity cover?",
    a: "We currently run simulations for Academic Counselors, BDRs, and Inside Sales, the three highest volume roles at EdTech companies. New roles are added based on demand.",
  },
  {
    q: "What if there are not enough candidates in the pool when I post?",
    a: "We guarantee a shortlist of 8 to 12 qualified candidates. If the pool does not meet bar, we re run the process at no cost. If zero candidates pass, you do not pay.",
  },
  {
    q: "How is this different from a recruitment agency?",
    a: "Agencies do sourcing and screening calls and charge 15 to 20% of salary. Crarity tests candidates before they reach you. You only pay a flat fee and you only talk to people who already proved they can do the job.",
  },
  {
    q: "What does a candidate simulation involve?",
    a: "Candidates complete a 15 to 20 minute task that mirrors the actual job. Academic Counselors handle a recorded parent call and draft a follow up plan. BDRs write a cold outreach sequence. Inside Sales negotiate a contract over email.",
  },
  {
    q: "How fresh is the candidate pool?",
    a: "We show you candidates who completed their simulation in the last 30 days. Candidates can retake simulations to improve their score and stay active in the pool.",
  },
  {
    q: "Where are you currently operating?",
    a: "We are piloting with EdTech companies in Bangalore. Remote candidates are supported across all roles.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";
  return (
    <section
      id="faq"
      style={{
        padding: isMobile ? "60px 20px" : isTablet ? "80px 32px" : "100px 24px",
        background: T.white,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: isMobile ? 32 : "clamp(32px, 4vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          Frequently asked
        </h2>
        <p style={{ color: T.dim, fontSize: 15, marginBottom: isMobile ? 32 : 48 }}>
          Still have a question?{" "}
          <a
            href="mailto:hello@crarity.com"
            style={{ color: T.text, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Contact us
          </a>
        </p>
        {faqs.map((f, i) => (
          <div
            key={i}
            style={{
              borderTop: `1px solid ${T.border}`,
              ...(i === faqs.length - 1 ? { borderBottom: `1px solid ${T.border}` } : {}),
            }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "22px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                textAlign: "left",
                cursor: "pointer",
                fontFamily: T.sans,
              }}
            >
              <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 500, color: T.text }}>{f.q}</span>
              <span
                style={{
                  fontSize: 22,
                  color: T.text,
                  lineHeight: 1,
                  flexShrink: 0,
                  display: "inline-block",
                  transform: open === i ? "rotate(45deg)" : "none",
                  transition: "transform 0.2s",
                  fontWeight: 300,
                }}
              >
                +
              </span>
            </button>
            {open === i && (
              <div style={{ paddingBottom: 22 }}>
                <p style={{ fontSize: 15, color: T.dim, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";
  return (
    <section
      style={{
        background: T.green,
        padding: isMobile ? "80px 20px" : isTablet ? "100px 32px" : "120px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: isMobile ? 36 : isTablet ? 56 : "clamp(40px, 6vw, 72px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: isMobile ? 1.15 : 1.0,
            marginBottom: isMobile ? 16 : 20,
            color: T.text,
          }}
        >
          {isMobile ? (
            "Ready to reclaim your hiring?"
          ) : (
            <>
              Ready to reclaim
              <br />
              your hiring?
            </>
          )}
        </h2>
        <p
          style={{
            fontSize: isMobile ? 16 : 17,
            color: "rgba(26,26,26,0.65)",
            marginBottom: isMobile ? 28 : 44,
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          Hire qualified Academic Counsellors this week
        </p>
        <BlackPillBtn size={isMobile ? "md" : "lg"}>Start hiring now</BlackPillBtn>
        <div
          style={{
            marginTop: isMobile ? 24 : 28,
            display: "flex",
            gap: isMobile ? 10 : 24,
            justifyContent: "center",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
          }}
        >
          {["Describe your role", "Get an instant shortlist", "Hire this week"].map((t) => (
            <span
              key={t}
              style={{ fontSize: 14, color: "rgba(26,26,26,0.7)", display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                  <path
                    d="M1 3.5l1.5 1.5 3.5-3"
                    stroke="#1a1a1a"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  return (
    <footer
      style={{
        background: T.white,
        padding: isMobile ? "32px 20px" : "36px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: isMobile ? 16 : 20,
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>crarity</span>
          <span style={{ fontSize: 13, color: T.dimmer, marginLeft: isMobile ? 0 : 8 }}>
            2026. All rights reserved.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: isMobile ? 20 : 28,
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {["How it works", "Features", "FAQ", "Contact"].map((l) => (
            <a
              key={l}
              href="#"
              style={{ fontSize: 14, color: T.dimmer, transition: "color 0.15s", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = T.text)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = T.dimmer)}
            >
              {l}
            </a>
          ))}
          <span style={{ color: T.dimmer, fontSize: 14 }}>|</span>
          <Link
            to="/privacy"
            style={{ fontSize: 14, color: T.dimmer, textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = T.text)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = T.dimmer)}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            style={{ fontSize: 14, color: T.dimmer, textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = T.text)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = T.dimmer)}
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

function WhyCrarity() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";
  return (
    <section
      style={{
        background: T.white,
        marginTop: isMobile ? 48 : 64,
        marginBottom: isMobile ? 24 : 40,
        padding: isMobile ? "0 20px" : "0 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: isMobile ? 26 : isTablet ? 36 : "clamp(28px, 4vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textAlign: "center",
            color: "#1a1a1a",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Speed, quality and volume{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            all under one roof
            <svg
              viewBox="0 0 300 12"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -8,
                width: "100%",
                height: 12,
                pointerEvents: "none",
              }}
            >
              <path
                d="M2,7 Q15,1 30,7 T60,7 T90,7 T120,7 T150,7 T180,7 T210,7 T240,7 T270,7 T298,7"
                stroke="#C5E831"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </h2>
      </div>
    </section>
  );
}

const Index = () => {
  return (
    <div style={{ fontFamily: T.sans, background: T.white, color: T.text, WebkitFontSmoothing: "antialiased" }}>
      <Nav />
      <Hero />
      <HowItWorks />
      <WhyCrarity />
      <Features />
      <ValueComparison />
      <FAQ />
      <FinalCTA />
      <FooterSection />
    </div>
  );
};

export default Index;
