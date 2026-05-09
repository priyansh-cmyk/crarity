import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CandidateLayout from "@/components/dashboard/CandidateLayout";

const T = {
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
};

type Props = {
  title: string;
  /** Optional one-line description shown under the title. */
  description?: string;
};

const ComingSoon = ({ title, description }: Props) => {
  const { pathname } = useLocation();
  const isCandidate = pathname.startsWith("/candidate");
  const Layout = isCandidate ? CandidateLayout : DashboardLayout;
  const backTo = isCandidate ? "/candidate/dashboard" : "/roles";
  const backLabel = isCandidate ? "Back to Dashboard" : "Back to Roles";

  return (
    <Layout>
      <div style={{ maxWidth: 720 }}>
        <Link
          to={backTo}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: T.sans,
            fontSize: 14,
            color: T.dim,
            textDecoration: "none",
            marginBottom: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.dim)}
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          {backLabel}
        </Link>

        <h1
          style={{
            fontFamily: T.sans,
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p style={{ marginTop: 10, fontSize: 16, color: T.dim, lineHeight: 1.6 }}>
          {description ?? "Coming soon."}
        </p>

        <div
          style={{
            marginTop: 32,
            background: "#fff",
            border: `1px dashed ${T.border}`,
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            color: T.dim,
            fontSize: 14,
          }}
        >
          This section is being built. Check back shortly.
        </div>
      </div>
    </Layout>
  );
};

export default ComingSoon;
