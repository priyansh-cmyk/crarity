export const ROLE_LABELS: Record<string, string> = {
  academic_counselor: "Academic Counselor",
  bdr: "BDR",
  inside_sales: "Inside Sales",
  marketing: "Marketing",
};

export function roleLabel(roleType: string | null | undefined): string {
  if (!roleType) return "Unknown";
  return ROLE_LABELS[roleType] ?? roleType.replace(/_/g, " ");
}

// Game metadata per role — drives the dynamic breakdown UI.
export type GameType = "selection" | "mcq" | "voice" | "text" | "other";

export type GameMeta = {
  key: string; // key inside scores object
  title: string;
  type: GameType;
  maxScore: number;
};

export const ROLE_GAMES: Record<string, GameMeta[]> = {
  academic_counselor: [
    { key: "game1", title: "Pick Your Shot", type: "selection", maxScore: 25 },
    { key: "game2", title: "Say It Like You Mean It", type: "mcq", maxScore: 25 },
    { key: "game3", title: "Beyond The Student", type: "voice", maxScore: 25 },
    { key: "game4", title: "Handle the Heat", type: "text", maxScore: 25 },
  ],
};

export function gamesForRole(roleType: string | null | undefined): GameMeta[] {
  if (!roleType) return [];
  return ROLE_GAMES[roleType] ?? [];
}
