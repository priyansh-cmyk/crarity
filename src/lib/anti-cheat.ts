import type { Telemetry } from "@/hooks/useAssessmentTelemetry";

export type RiskTier = "high" | "medium" | "low";

export type RiskFlag = {
  kind: "tab" | "paste" | "speed" | "recording" | "ip";
  severity: number;
  message: string;
};

// Minimum reasonable time per game (seconds). Below = suspicious.
export const SPEED_THRESHOLDS: Record<string, number> = {
  game1: 60,
  game2: 90,
  game3: 15, // recording duration check
  game4: 30,
};

export function computeRisk(
  telemetry: Telemetry | null | undefined,
  scores: Record<string, Record<string, unknown>> | null | undefined,
  duplicateIpCount = 0,
): { score: number; tier: RiskTier; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  let score = 0;

  const tabSwitches = telemetry?.tab_switches ?? [];
  if (tabSwitches.length > 0) {
    const sev = Math.min(tabSwitches.length * 10, 50);
    score += sev;
    flags.push({
      kind: "tab",
      severity: sev,
      message: `Tab switching: ${tabSwitches.length} time${tabSwitches.length === 1 ? "" : "s"}`,
    });
  }

  const pastes = telemetry?.paste_events ?? [];
  if (pastes.length > 0) {
    score += 30;
    const fields = Array.from(new Set(pastes.map((p) => p.field))).join(", ");
    flags.push({
      kind: "paste",
      severity: 30,
      message: `Copy-paste detected: ${fields}`,
    });
  }

  // Speed checks via game_durations + scores
  const durations = telemetry?.game_durations ?? [];
  const slowestPerGame: Record<string, number> = {};
  durations.forEach((d) => {
    const key = d.game.replace(/-/g, "");
    slowestPerGame[key] = Math.max(slowestPerGame[key] ?? 0, d.duration_seconds);
  });

  Object.entries(SPEED_THRESHOLDS).forEach(([gameKey, threshold]) => {
    if (gameKey === "game3") return; // handled separately via recording
    const recorded = slowestPerGame[gameKey] ?? slowestPerGame[gameKey.replace("game", "game-")];
    if (recorded && recorded < threshold) {
      score += 20;
      flags.push({
        kind: "speed",
        severity: 20,
        message: `Suspicious speed: ${gameKey} completed in ${recorded}s (min ${threshold}s)`,
      });
    }
  });

  // Recording / Game 3 specific
  const game3 = (scores?.game3 as Record<string, unknown> | undefined) ?? {};
  const recordings = (game3.recordings as Array<{ duration?: number; size?: number }>) ?? [];
  let blank = false;
  recordings.forEach((r) => {
    if ((r.duration ?? 0) > 0 && (r.duration ?? 0) < SPEED_THRESHOLDS.game3) {
      blank = true;
      flags.push({
        kind: "recording",
        severity: 40,
        message: `Recording only ${r.duration}s long`,
      });
    }
    if ((r.size ?? Infinity) < 10 * 1024) {
      blank = true;
      flags.push({
        kind: "recording",
        severity: 40,
        message: `Recording file unusually small (${r.size} bytes)`,
      });
    }
  });
  if (blank) score += 40;

  if (duplicateIpCount > 3) {
    score += 25;
    flags.push({
      kind: "ip",
      severity: 25,
      message: `Same IP submitted ${duplicateIpCount} assessments in 24h`,
    });
  }

  score = Math.min(100, score);
  const tier: RiskTier = score > 50 ? "high" : score >= 30 ? "medium" : "low";
  return { score, tier, flags };
}

export const RISK_TIER_META: Record<RiskTier, { label: string; bg: string; fg: string; border: string }> = {
  high: { label: "High Risk", bg: "#fef2f2", fg: "#991b1b", border: "#ef4444" },
  medium: { label: "Medium Risk", bg: "#fef9c3", fg: "#854d0e", border: "#eab308" },
  low: { label: "Low Risk", bg: "#f0fdf4", fg: "#166534", border: "#16a34a" },
};
