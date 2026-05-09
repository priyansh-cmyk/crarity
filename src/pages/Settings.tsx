import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaa",
  border: "#e8e3d8",
  disabled: "#fafaf8",
};

const companyFromEmail = (email?: string | null) => {
  if (!email) return "";
  const domain = email.split("@")[1]?.split(".")[0] ?? "";
  if (!domain) return "";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
};

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const email = user?.email ?? "";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, company_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const fullName =
        data?.full_name ?? (user.user_metadata?.full_name as string) ?? "";
      const company =
        data?.company_name ??
        (user.user_metadata?.company_name as string) ??
        companyFromEmail(user.email);
      setName(fullName);
      setInitialName(fullName);
      setCompanyName(company);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isDirty = name.trim() !== initialName.trim() && name.trim().length > 0;

  const handleSave = async () => {
    if (!user || !isDirty) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(`Couldn't save: ${error.message}`);
      return;
    }
    setInitialName(name.trim());
    toast.success("Changes saved");
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: T.sans,
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.02em",
            color: T.text,
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 16,
            color: T.dim,
            fontFamily: T.sans,
          }}
        >
          Manage your account information
        </p>

        <div
          style={{
            marginTop: 40,
            background: "#fff",
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          {/* Company Information */}
          <Section title="Company Information">
            <Field label="Company name">
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={loading ? "" : companyName}
                  disabled
                  style={{
                    ...inputStyle,
                    background: T.disabled,
                    cursor: "not-allowed",
                    paddingRight: 44,
                    color: T.text,
                  }}
                />
                <Lock
                  size={16}
                  color={T.dimmer}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: T.dimmer,
                  fontStyle: "italic",
                  fontFamily: T.sans,
                }}
              >
                Extracted from your work email domain
              </p>
            </Field>
          </Section>

          <div style={{ height: 28 }} />

          {/* Your Account */}
          <Section title="Your Account">
            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
                style={inputStyle}
              />
            </Field>
            <div style={{ height: 24 }} />
            <Field label="Email">
              <input
                type="email"
                value={email}
                disabled
                readOnly
                style={{
                  ...inputStyle,
                  background: T.disabled,
                  color: T.dimmer,
                  cursor: "not-allowed",
                }}
              />
            </Field>
          </Section>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving || loading}
            style={{
              marginTop: 40,
              width: "100%",
              height: 48,
              background: T.text,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontFamily: T.sans,
              fontWeight: 600,
              fontSize: 15,
              cursor: !isDirty || saving ? "not-allowed" : "pointer",
              opacity: !isDirty || saving ? 0.5 : 1,
              transition: "opacity 0.15s ease, transform 0.15s ease",
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

/* ============================== Pieces ================================= */
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 52,
  padding: "0 16px",
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  fontFamily: T.sans,
  fontSize: 16,
  fontWeight: 400,
  color: T.text,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <div
      style={{
        fontFamily: T.sans,
        fontWeight: 600,
        fontSize: 16,
        color: T.text,
        marginBottom: 16,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label
      style={{
        display: "block",
        fontFamily: T.sans,
        fontWeight: 500,
        fontSize: 14,
        color: T.dim,
        marginBottom: 8,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);
