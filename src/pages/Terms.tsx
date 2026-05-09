import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
};

const Terms = () => (
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
        Terms of Service
      </h1>
      <p style={{ fontSize: 14, color: T.dim, marginBottom: 60 }}>Last updated: May 9, 2026</p>

      <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
        These Terms of Service govern your use of Crarity — a hiring simulation platform that helps companies assess candidates for entry-level roles through structured, job-relevant tasks. By using Crarity, you agree to these terms.
      </p>

      <Section title="1. Acceptance of Terms">
        <p>
          By creating an account or participating in an assessment on Crarity, you confirm that you have read, understood, and agree to be bound by these Terms. If you are using Crarity on behalf of a company, you represent that you have the authority to bind that company to these Terms.
        </p>
        <p>
          If you do not agree, please do not use the platform.
        </p>
      </Section>

      <Section title="2. Use of Service">
        <p>Crarity provides two types of accounts:</p>
        <ul>
          <li><strong>Employer accounts</strong> — for companies to post roles, invite candidates, and review assessment results.</li>
          <li><strong>Candidate accounts</strong> — for individuals to complete hiring assessments and manage their profile.</li>
        </ul>
        <p>You agree to use Crarity only for its intended purpose: legitimate hiring and job-seeking activity. You must not:</p>
        <ul>
          <li>Share your assessment link with others or have someone else complete it on your behalf</li>
          <li>Attempt to reverse-engineer, scrape, or copy any part of the platform</li>
          <li>Use the platform to harass, mislead, or harm other users</li>
          <li>Create multiple accounts to game assessments or rankings</li>
        </ul>
      </Section>

      <Section title="3. User Accounts">
        <p>
          You are responsible for keeping your account credentials secure. Do not share your password with anyone. If you suspect unauthorised access to your account, notify us immediately at{" "}
          <a href="mailto:priyansh@crarity.com" style={{ color: T.text }}>priyansh@crarity.com</a>.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, without prior notice.
        </p>
      </Section>

      <Section title="4. Assessment Process">
        <p>
          Crarity's assessments are designed to simulate real job tasks in a fair, structured way. By participating:
        </p>
        <ul>
          <li>You consent to your responses, scores, and any recordings being shared with the employer who invited you.</li>
          <li>You understand that assessment results are generated algorithmically and represent one signal among many — not a definitive judgement of your ability.</li>
          <li>You agree not to copy, distribute, or share assessment content, questions, or scenarios with others.</li>
        </ul>
        <p>
          Employers agree to use assessment data only for the purpose of evaluating candidates for the specific role the candidate was invited for, and in compliance with applicable employment laws.
        </p>
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          All content on Crarity — including assessment designs, scoring models, UI, and branding — is the property of Crarity and protected by applicable intellectual property laws. You may not reproduce or use any of it without written permission.
        </p>
        <p>
          Content you upload (resume, profile information) remains yours. By uploading it, you grant Crarity a limited licence to use it solely for the purpose of operating the platform.
        </p>
      </Section>

      <Section title="6. Limitation of Liability">
        <p>
          Crarity is provided "as is." We do our best to keep the platform running smoothly, but we cannot guarantee uninterrupted service or error-free operation.
        </p>
        <p>
          To the maximum extent permitted by law, Crarity shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform — including hiring decisions made by employers based on assessment results.
        </p>
        <p>
          Employers are solely responsible for their hiring decisions. Crarity provides assessment data as one input; it does not make hiring recommendations or decisions.
        </p>
      </Section>

      <Section title="7. Governing Law and Jurisdiction">
        <p>
          These Terms are governed by the laws of India. Any disputes arising from the use of Crarity shall be subject to the exclusive jurisdiction of the courts in <strong>Bangalore, Karnataka, India</strong>.
        </p>
      </Section>

      <Section title="8. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we do, we'll update the "Last updated" date at the top of this page. Continued use of Crarity after changes are posted constitutes your acceptance of the updated Terms.
        </p>
      </Section>

      <Section title="9. Contact Us">
        <p>Questions about these Terms? Get in touch:</p>
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
        <Link to="/privacy" style={{ color: T.dim }}>Privacy Policy</Link>
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

export default Terms;
