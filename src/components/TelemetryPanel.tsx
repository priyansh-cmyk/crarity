import { useState } from "react";

type PasteEvent = { game: string; timestamp: string; field: string };
type TabSwitch = { game: string; blur_at: string; focus_at: string; duration_seconds: number };
export type TelemetryShape = {
  paste_events?: PasteEvent[];
  tab_switches?: TabSwitch[];
};

const T = {
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  bg: "#f7f6f3",
  warn: "#b54708",
  warnBg: "#fef0c7",
};

export default function TelemetryPanel({ telemetry }: { telemetry: TelemetryShape | null | undefined }) {
  const [open, setOpen] = useState(false);
  const pastes = telemetry?.paste_events ?? [];
  const tabs = telemetry?.tab_switches ?? [];
  const totalAway = tabs.reduce((s, t) => s + (Number(t.duration_seconds) || 0), 0);
  const hasAny = pastes.length > 0 || tabs.length > 0;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Assessment integrity</div>
          <div style={{ color: T.dim, fontSize: 14, marginTop: 4 }}>
            {hasAny ? (
              <>
                {pastes.length} paste event{pastes.length === 1 ? "" : "s"}, {tabs.length} tab switch
                {tabs.length === 1 ? "" : "es"}
                {totalAway > 0 ? ` (total ${totalAway} second${totalAway === 1 ? "" : "s"} away)` : ""}
              </>
            ) : (
              "No paste or tab-switch events recorded."
            )}
          </div>
        </div>
        {hasAny && (
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: open ? T.text : "#fff",
              color: open ? "#fff" : T.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {open ? "Hide details" : "View details"}
          </button>
        )}
      </div>

      {open && hasAny && (
        <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
          {pastes.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                Paste events
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                {pastes.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      padding: "10px 14px",
                      borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ color: T.text, fontWeight: 600 }}>{p.game}</div>
                    <div style={{ color: T.dim }}>{p.field}</div>
                    <div style={{ color: T.dim }}>{new Date(p.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabs.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                Tab switches
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                {tabs.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 100px",
                      padding: "10px 14px",
                      borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ color: T.text, fontWeight: 600 }}>{t.game}</div>
                    <div style={{ color: T.dim }}>{new Date(t.blur_at).toLocaleTimeString()}</div>
                    <div style={{ color: T.dim }}>{new Date(t.focus_at).toLocaleTimeString()}</div>
                    <div style={{ color: T.warn, fontWeight: 600 }}>{t.duration_seconds}s away</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
