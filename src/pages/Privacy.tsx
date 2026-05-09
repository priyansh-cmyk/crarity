import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
};

const Privacy = () => (
  <div style={{ minHeight: "100vh", background: "#fff", fontFamily: T.sans, color: T.text }}>
    <header style={{ padding: "24px 40px", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: 22, color: T.text, textDecoration: "none", letterSpacing: "-0.02em" }}>
          crarity
        </Link>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: T.dim, textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    </header>

    <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 14, color: T.dim, marginBottom: 60 }}>Last updated: May 9, 2026</p>

      <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
        Crarity is a hiring assessment platform based in India. We take your privacy seriously. This policy explains what data we collect, why we collect it, and how we keep it safe — in plain language you can actually understand.
      </p>

      <Section title="1. Information We Collect">
        <p>When you use Crarity, we may collect the following:</p>
        <ul>
          <li><strong>Account information</strong> — your name, email address, and password when you sign up.</li>
          <li><strong>Candidate profile data</strong> — resume uploads, work experience, education, and location you choose to share.</li>
          <li><strong>Assessment data</strong> — your responses, scores, and performance during hiring simulations.</li>
          <li><strong>Video and audio recordings</strong> — if your assessment includes recorded tasks, those recordings are stored securely.</li>
          <li><strong>Usage data</strong> — pages visited, time spent, and interactions within the platform to help us improve.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use your data to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Run assessments and generate your performance report</li>
          <li>Share your results with employers who invited you (only the employer who sent your link)</li>
          <li>Improve our platform based on usage patterns</li>
          <li>Send important account-related emails (no marketing spam)</li>
        </ul>
        <p>We never sell your personal data to third parties.</p>
      </Section>

      <Section title="3. Data Storage and Security">
        <p>
          Your data is stored on <strong>Supabase</strong>, a trusted cloud infrastructure provider with servers in the India/Singapore region. All data is encrypted in transit (TLS) and at rest.
        </p>
        <p>
          Assessment recordings and file uploads are stored in secure, access-controlled storage buckets. Only authorised Crarity personnel and the employer who invited you can access your data.
        </p>
        <p>
          We retain your data for as long as your account is active. You can request deletion at any time by emailing us.
        </p>
      </Section>

      <Section title="4. Your Rights">
        <p>Under Indian data protection law and GDPR principles, you have the right to:</p>
        <ul>
          <li><strong>Access</strong> — request a copy of the data we hold about you</li>
          <li><strong>Correction</strong> — ask us to fix inaccurate information</li>
          <li><strong>Deletion</strong> — request that we delete your account and associated data</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
          <li><strong>Withdraw consent</strong> — stop participating in an assessment at any time</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:priyansh@crarity.com" style={{ color: T.text }}>priyansh@crarity.com</a>.
          We will respond within 30 days.
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          We use minimal cookies — only what's necessary to keep you logged in and the platform working correctly. We don't use tracking cookies or third-party advertising cookies.
        </p>
      </Section>

      <Section title="6. Third-Party Services">
        <p>We use the following services to operate Crarity:</p>
        <ul>
          <li><strong>Supabase</strong> — database, authentication, and file storage</li>
          <li><strong>Google OAuth</strong> — optional sign-in method (only if you choose it)</li>
        </ul>
        <p>Each service has its own privacy policy and is bound by data processing agreements.</p>
      </Section>

      <Section title="7. Contact Us">
        <p>
          If you have any questions about this policy or how your data is handled, reach out to us:
        </p>
        <p>
          <strong>Crarity</strong><br />
          Bangalore, Karnataka, India<br />
          <a href="mailto:priyansh@crarity.com" style={{ color: T.text }}>priyansh@crarity.com</a>
        </p>
      </Section>
    </main>

    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "32px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 13, color: T.dim }}>
        © 2026 Crarity. All rights reserved. ·{" "}
        <Link to="/terms" style={{ color: T.dim }}>Terms of Service</Link>
      </p>
    </footer>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 48 }}>
    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 20 }}>{title}</h2>
    <div style={{ fontSize: 16, lineHeight: 1.8, color: T.text, display: "flex", flexDirection: "column", gap: 14 }}>
      {children}
    </div>
  </section>
);

export default Privacy;
