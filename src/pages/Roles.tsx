import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  IndianRupee,
  Clock,
  Users,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ============================== Tokens ================================= */
const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaa",
  border: "#e8e3d8",
  green: "#C5E831",
  paused: "#f3f4f6",
  closed: "#e8e3d8",
};

const ROLE_LABELS: Record<string, string> = {
  academic_counselor: "Academic Counselor",
  inside_sales: "Inside Sales Representative",
  bdr: "Business Development Representative",
};

type RoleRow = {
  id: string;
  role_type: string;
  status: string;
  created_at: string;
  custom_requirements: Record<string, unknown> | null;
  candidate_count: number;
};

/* ============================== Helpers ================================ */
const formatPostedDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const labelOf = (roleType: string) =>
  ROLE_LABELS[roleType] ??
  roleType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const formatSalary = (req: Record<string, unknown> | null) => {
  if (!req) return "—";
  const min = (req.salary_min ?? req.salaryMin) as string | undefined;
  const max = (req.salary_max ?? req.salaryMax) as string | undefined;
  if (!min && !max) return "—";
  const fmt = (v?: string) => (v ? `₹${v}L` : "—");
  return `${fmt(min)} – ${fmt(max)}/year`;
};

const reqString = (
  req: Record<string, unknown> | null,
  ...keys: string[]
): string => {
  if (!req) return "—";
  for (const k of keys) {
    const v = req[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return "—";
};

/* ============================== Page =================================== */
const Roles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoleRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  const load = async () => {
    if (!user) {
      setRoles([]);
      return;
    }
    const { data, error } = await supabase
      .from("roles")
      .select(
        "id, role_type, status, created_at, custom_requirements, candidate_roles(count)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load roles");
      setRoles([]);
      return;
    }

    const rows: RoleRow[] = (data ?? []).map((r) => {
      const cr = (r as { candidate_roles?: Array<{ count: number }> })
        .candidate_roles;
      const count = Array.isArray(cr) && cr[0] ? cr[0].count ?? 0 : 0;
      return {
        id: r.id,
        role_type: r.role_type,
        status: r.status,
        created_at: r.created_at,
        custom_requirements:
          (r.custom_requirements as Record<string, unknown> | null) ?? null,
        candidate_count: count,
      };
    });
    setRoles(rows);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (role: RoleRow, status: string) => {
    setBusyId(role.id);
    const { error } = await supabase
      .from("roles")
      .update({ status })
      .eq("id", role.id);
    setBusyId(null);
    if (error) {
      toast.error(`Couldn't update role: ${error.message}`);
      return;
    }
    toast.success(
      status === "paused"
        ? "Role paused"
        : status === "closed"
          ? "Role closed"
          : "Role updated",
    );
    load();
  };

  const deleteRole = async (role: RoleRow) => {
    setBusyId(role.id);
    const { error } = await supabase.from("roles").delete().eq("id", role.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) {
      toast.error(`Couldn't delete: ${error.message}`);
      return;
    }
    toast.success("Role deleted");
    load();
  };

  /* ============================== Render =============================== */
  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
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
              Your Roles
            </h1>
            <p
              style={{
                marginTop: 12,
                fontSize: 16,
                color: T.dim,
                fontFamily: T.sans,
              }}
            >
              Manage your active hiring roles
            </p>
          </div>
          {/* Create button intentionally removed — use the "Create Role" tab in the sidebar */}
        </div>

        {/* List */}
        <div style={{ marginTop: 40 }}>
          {roles === null ? (
            <ListSkeleton />
          ) : roles.length === 0 ? (
            <EmptyState onCreate={() => navigate("/roles/create")} />
          ) : (
            roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isMobile={isMobile}
                busy={busyId === role.id}
                onView={() => navigate(`/candidates?role_id=${role.id}`)}
                onPause={() => updateStatus(role, "paused")}
                onReopen={() => updateStatus(role, "open")}
                onClose={() => updateStatus(role, "closed")}
                onDelete={() => setConfirmDelete(role)}
              />
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <DeleteModal
          role={confirmDelete}
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteRole(confirmDelete)}
        />
      )}
    </DashboardLayout>
  );
};

export default Roles;

/* ============================== Card =================================== */
const RoleCard = ({
  role,
  isMobile,
  busy,
  onView,
  onPause,
  onReopen,
  onClose,
  onDelete,
}: {
  role: RoleRow;
  isMobile: boolean;
  busy: boolean;
  onView: () => void;
  onPause: () => void;
  onReopen: () => void;
  onClose: () => void;
  onDelete: () => void;
}) => {
  const [hover, setHover] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  const status = (role.status || "open").toLowerCase();
  const statusLabel =
    status === "open" || status === "active"
      ? "Active"
      : status === "paused"
        ? "Paused"
        : status === "closed"
          ? "Closed"
          : status.charAt(0).toUpperCase() + status.slice(1);

  const statusBg =
    statusLabel === "Active"
      ? T.green
      : statusLabel === "Paused"
        ? T.paused
        : T.closed;
  const statusFg = statusLabel === "Active" ? T.text : T.dim;

  const location = reqString(role.custom_requirements, "location");
  const salary = formatSalary(role.custom_requirements);
  const timeline = reqString(
    role.custom_requirements,
    "timeline",
    "start_date",
  );
  const positions = reqString(
    role.custom_requirements,
    "positions",
    "openings",
  );

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: isMobile ? 20 : 28,
        marginBottom: 20,
        maxWidth: 900,
        boxShadow: hover
          ? "0 4px 20px rgba(0,0,0,0.08)"
          : "0 2px 12px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <h2
          style={{
            fontFamily: T.sans,
            fontWeight: 700,
            fontSize: isMobile ? 20 : 24,
            letterSpacing: "-0.01em",
            color: T.text,
            margin: 0,
          }}
        >
          {labelOf(role.role_type)}
        </h2>
        <span
          style={{
            background: statusBg,
            color: statusFg,
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: T.sans,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Details row */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          gap: isMobile ? 10 : 20,
        }}
      >
        <DetailItem icon={<MapPin size={16} />} text={location} />
        <DetailItem icon={<IndianRupee size={16} />} text={salary} />
        <DetailItem icon={<Clock size={16} />} text={timeline} />
        <DetailItem icon={<Users size={16} />} text={`${positions} positions`} />
      </div>

      {/* Candidate count */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: T.green,
            boxShadow: "0 0 0 4px rgba(197, 232, 49, 0.25)",
          }}
        />
        <span
          style={{
            fontFamily: T.sans,
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: T.text,
          }}
        >
          {role.candidate_count}
        </span>
        <span style={{ fontSize: 15, color: T.dim }}>candidates matched</span>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onView}
        onMouseEnter={() => setCtaHover(true)}
        onMouseLeave={() => setCtaHover(false)}
        style={{
          marginTop: 24,
          width: "100%",
          height: 48,
          background: T.text,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontFamily: T.sans,
          fontWeight: 500,
          fontSize: 15,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          transform: ctaHover ? "translateY(-1px)" : "translateY(0)",
          boxShadow: ctaHover ? "0 6px 20px rgba(0,0,0,0.18)" : "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <span>View {role.candidate_count} candidates</span>
        <ArrowRight size={18} color={T.green} />
      </button>

      {/* Secondary actions */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {status !== "paused" && status !== "closed" && (
          <SecondaryAction label="Pause role" onClick={onPause} disabled={busy} />
        )}
        {status === "paused" && (
          <SecondaryAction
            label="Reopen role"
            onClick={onReopen}
            disabled={busy}
          />
        )}
        {status !== "closed" && (
          <SecondaryAction label="Close role" onClick={onClose} disabled={busy} />
        )}
        <SecondaryAction label="Delete role" onClick={onDelete} disabled={busy} />
      </div>

      {/* Posted date */}
      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: T.dimmer,
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        Posted {formatPostedDate(role.created_at)}
      </div>
    </div>
  );
};

/* ============================== Pieces ================================= */
const DetailItem = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 15,
      color: T.dim,
      fontFamily: T.sans,
    }}
  >
    <span style={{ color: T.dim, display: "inline-flex" }}>{icon}</span>
    <span>{text}</span>
  </div>
);

const SecondaryAction = ({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        fontSize: 14,
        color: T.dim,
        fontFamily: T.sans,
        cursor: disabled ? "not-allowed" : "pointer",
        textDecoration: hover ? "underline" : "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div
    style={{
      background: "#fff",
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: 64,
      textAlign: "center",
      maxWidth: 900,
    }}
  >
    <div style={{ display: "inline-flex", color: T.border }}>
      <Briefcase size={64} />
    </div>
    <h2
      style={{
        marginTop: 16,
        fontFamily: T.sans,
        fontWeight: 700,
        fontSize: 24,
        color: T.text,
      }}
    >
      No roles yet
    </h2>
    <p
      style={{
        marginTop: 12,
        fontSize: 16,
        color: T.dim,
        fontFamily: T.sans,
      }}
    >
      Create your first role.
    </p>
    <button
      type="button"
      onClick={onCreate}
      style={{
        marginTop: 32,
        height: 48,
        padding: "0 26px",
        background: T.text,
        color: "#fff",
        border: "none",
        borderRadius: 999,
        fontFamily: T.sans,
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
      }}
    >
      + Create your first role
    </button>
  </div>
);

const ListSkeleton = () => (
  <>
    {[0, 1].map((i) => (
      <div
        key={i}
        style={{
          background: "#fff",
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 20,
          maxWidth: 900,
          height: 280,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    ))}
    <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }`}</style>
  </>
);

const DeleteModal = ({
  role,
  busy,
  onCancel,
  onConfirm,
}: {
  role: RoleRow;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div
    role="dialog"
    aria-modal="true"
    onClick={onCancel}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        maxWidth: 440,
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}
    >
      <h3
        style={{
          fontFamily: T.sans,
          fontWeight: 700,
          fontSize: 22,
          color: T.text,
          margin: 0,
        }}
      >
        Delete this role?
      </h3>
      <p
        style={{
          marginTop: 12,
          fontSize: 15,
          color: T.dim,
          fontFamily: T.sans,
          lineHeight: 1.5,
        }}
      >
        Are you sure you want to delete{" "}
        <strong style={{ color: T.text }}>{labelOf(role.role_type)}</strong>?
        This cannot be undone.
      </p>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{
            height: 42,
            padding: "0 18px",
            background: "#fff",
            color: T.text,
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            fontFamily: T.sans,
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          style={{
            height: 42,
            padding: "0 18px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontFamily: T.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Deleting..." : "Delete role"}
        </button>
      </div>
    </div>
  </div>
);
