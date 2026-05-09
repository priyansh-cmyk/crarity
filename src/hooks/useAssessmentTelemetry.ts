import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type PasteEvent = { game: string; timestamp: string; field: string; content_preview?: string };
type TabSwitch = { game: string; blur_at: string; focus_at: string; duration_seconds: number };
type GameDuration = { game: string; duration_seconds: number; started_at: string; ended_at: string };

export type Telemetry = {
  paste_events?: PasteEvent[];
  tab_switches?: TabSwitch[];
  game_durations?: GameDuration[];
  ip_address?: string;
};

/**
 * Passively records anti-cheating signals to assessment_sessions.telemetry.
 * Tracks: paste events (with preview), tab switches, per-game duration, IP address.
 * Never blocks the candidate. Best-effort writes — failures are swallowed.
 */
export function useAssessmentTelemetry(sessionId: string | null, game: string) {
  const queueRef = useRef<{ paste: PasteEvent[]; tab: TabSwitch[]; durations: GameDuration[] }>({
    paste: [], tab: [], durations: [],
  });
  const flushingRef = useRef(false);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const ipFetchedRef = useRef(false);

  const flush = async () => {
    if (!sessionId || flushingRef.current) return;
    const queued = queueRef.current;
    if (queued.paste.length === 0 && queued.tab.length === 0 && queued.durations.length === 0) return;
    flushingRef.current = true;
    const toSend = {
      paste: [...queued.paste],
      tab: [...queued.tab],
      durations: [...queued.durations],
    };
    queueRef.current = { paste: [], tab: [], durations: [] };
    try {
      const { data: row } = await supabase
        .from("assessment_sessions")
        .select("telemetry")
        .eq("id", sessionId)
        .maybeSingle();
      const existing = ((row?.telemetry as Telemetry | null) ?? {}) as Telemetry;
      const merged: Telemetry = {
        ...existing,
        paste_events: [...(existing.paste_events ?? []), ...toSend.paste],
        tab_switches: [...(existing.tab_switches ?? []), ...toSend.tab],
        game_durations: [...(existing.game_durations ?? []), ...toSend.durations],
      };
      await supabase
        .from("assessment_sessions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ telemetry: merged as any })
        .eq("id", sessionId);
    } catch {
      queueRef.current.paste.unshift(...toSend.paste);
      queueRef.current.tab.unshift(...toSend.tab);
      queueRef.current.durations.unshift(...toSend.durations);
    } finally {
      flushingRef.current = false;
    }
  };

  // Capture IP once per session (silent — admin only)
  useEffect(() => {
    if (!sessionId || ipFetchedRef.current) return;
    ipFetchedRef.current = true;
    (async () => {
      try {
        const { data: row } = await supabase
          .from("assessment_sessions")
          .select("telemetry")
          .eq("id", sessionId)
          .maybeSingle();
        const existing = ((row?.telemetry as Telemetry | null) ?? {}) as Telemetry;
        if (existing.ip_address) return;
        const res = await fetch("https://api.ipify.org?format=json");
        if (!res.ok) return;
        const { ip } = await res.json();
        if (!ip) return;
        const merged: Telemetry = { ...existing, ip_address: ip };
        await supabase
          .from("assessment_sessions")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ telemetry: merged as any })
          .eq("id", sessionId);
      } catch {
        // silent
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    startedAtRef.current = new Date().toISOString();

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea" && !(target as HTMLElement).isContentEditable) return;
      const field =
        (target as HTMLInputElement).name ||
        (target as HTMLElement).id ||
        tag ||
        "unknown";
      const text = e.clipboardData?.getData("text") ?? "";
      queueRef.current.paste.push({
        game,
        timestamp: new Date().toISOString(),
        field: `${game}:${field}`,
        content_preview: text.slice(0, 200),
      });
      void flush();
    };

    let blurAt: string | null = null;
    const handleVisibility = () => {
      if (document.hidden) {
        blurAt = new Date().toISOString();
      } else if (blurAt) {
        const focusAt = new Date().toISOString();
        const duration = Math.max(
          0,
          Math.round((new Date(focusAt).getTime() - new Date(blurAt).getTime()) / 1000),
        );
        queueRef.current.tab.push({ game, blur_at: blurAt, focus_at: focusAt, duration_seconds: duration });
        blurAt = null;
        void flush();
      }
    };

    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibility);
      // Record per-game duration on unmount
      const ended = new Date().toISOString();
      const dur = Math.max(
        0,
        Math.round((new Date(ended).getTime() - new Date(startedAtRef.current).getTime()) / 1000),
      );
      if (dur > 0) {
        queueRef.current.durations.push({
          game,
          duration_seconds: dur,
          started_at: startedAtRef.current,
          ended_at: ended,
        });
      }
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, game]);
}
