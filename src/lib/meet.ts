// Placeholder Google Meet link generator (Phase 2 will use real Calendar API).
function chunk(len: number) {
  const chars = "abcdefghijkmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function generateMeetLink(): string {
  return `https://meet.google.com/${chunk(3)}-${chunk(4)}-${chunk(3)}`;
}

export function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
