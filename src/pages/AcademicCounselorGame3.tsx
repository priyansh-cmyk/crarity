import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Mic, Video, Play, Pause, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAssessmentTelemetry } from "@/hooks/useAssessmentTelemetry";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";

const T = {
  white: "#ffffff",
  off: "#f7f6f3",
  green: "#C5E831",
  greenTint: "#f4fadc",
  border: "#e8e3d8",
  text: "#1a1a1a",
  dim: "#6b6b6b",
  dimmer: "#aaaaaa",
  red: "#dc2626",
  sans: "'Satoshi', 'Inter', system-ui, sans-serif",
};

type Step = "pitch" | "objection2";
type SubPhase = "choose" | "ready" | "recording" | "playback";
type Phase = "context" | "step" | "saving" | "unsupported";
type RecordKind = "voice" | "video";

type RoundResult = {
  kind: RecordKind;
  url: string | null;
  duration: number;
  transcript?: string;
};

const RECORD_SECS = 60;

const STEP_ORDER: Step[] = ["pitch", "objection2"];

const OBJECTION_TEXT: Record<"objection2", string> = {
  objection2:
    "We're already in talks with Vedantu and they're offering us a 15% discount if we enroll this week and their EMI plan has lower monthly payments than yours - why should we choose your program instead and can you match their pricing?",
};

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function pickAudioMime(): string {
  const candidates = [
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    for (const c of candidates) {
      if (c.startsWith("audio/mp4") && MediaRecorder.isTypeSupported(c)) return c;
    }
  }
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "audio/webm";
}

function pickVideoMime(): string {
  const candidates = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  if (typeof MediaRecorder === "undefined") return "video/webm";
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

function extFromMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export default function AcademicCounselorGame3() {
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const debugMode = params.get("debug") === "true";
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";

  useAssessmentTelemetry(sessionId, "game-3");

  const [phase, setPhase] = useState<Phase>("context");
  const [step, setStep] = useState<Step>("pitch");
  const [subPhase, setSubPhase] = useState<SubPhase>("choose");
  const [recordKind, setRecordKind] = useState<RecordKind>("voice");

  const [timeLeft, setTimeLeft] = useState(RECORD_SECS);
  const [recordedSecs, setRecordedSecs] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaMime, setMediaMime] = useState<string>("audio/webm");
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveLevels, setWaveLevels] = useState<number[]>(Array(24).fill(0.1));

  // Per-round results
  const [results, setResults] = useState<Record<Step, RoundResult | null>>({
    pitch: null,
    objection2: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [unsupportedReason, setUnsupportedReason] = useState<string>("");
  const [showParentModal, setShowParentModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (debugMode) return;
    if (!sessionId) {
      toast({
        title: "Missing session",
        description: "Please restart the assessment.",
        variant: "destructive",
      });
      fadeNavigate("/assessment/academic-counselor");
    }
  }, [sessionId, fadeNavigate, debugMode]);

  useEffect(() => {
    const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    const hasMediaRecorder = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";
    if (!hasMediaDevices || !hasMediaRecorder) {
      setUnsupportedReason("Recording isn't supported on this browser.");
      setPhase("unsupported");
    }
  }, []);

  useEffect(() => {
    if (phase !== "context") return;
    const t = window.setTimeout(() => setPhase("step"), 10000);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tickRef.current) window.clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && subPhase === "recording") {
        void acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [subPhase]);

  const acquireWakeLock = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.wakeLock?.request) {
        wakeLockRef.current = await nav.wakeLock.request("screen");
      }
    } catch {
      /* non-fatal */
    }
  };

  const releaseWakeLock = () => {
    try {
      wakeLockRef.current?.release?.();
    } catch {
      /* ignore */
    }
    wakeLockRef.current = null;
  };

  const resetMedia = () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(null);
    setMediaBlob(null);
    setRecordedSecs(0);
    setIsPlaying(false);
    setTimeLeft(RECORD_SECS);
  };

  const startRecording = async (kind: RecordKind) => {
    setRecordKind(kind);
    try {
      const constraints: MediaStreamConstraints =
        kind === "video"
          ? {
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
              },
            };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const mime = kind === "video" ? pickVideoMime() : pickAudioMime();
      setMediaMime(mime.split(";")[0]);

      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, { mimeType: mime });
      } catch {
        mr = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] });
        setMediaBlob(blob);
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        const elapsed = Math.min(RECORD_SECS, Math.round((Date.now() - startedAtRef.current) / 1000));
        setRecordedSecs(elapsed);
        setSubPhase("playback");
        console.log("[Game3] Recording complete", { kind, step, mime, size: blob.size, elapsed });
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (tickRef.current) window.clearInterval(tickRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        releaseWakeLock();
      };

      // Audio waveform (for both voice and video so user knows mic is working)
      try {
        const ctx = new (
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const animate = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          const bars = 24;
          const slice = Math.floor(data.length / bars);
          const next: number[] = [];
          for (let i = 0; i < bars; i++) {
            let sum = 0;
            for (let j = 0; j < slice; j++) sum += data[i * slice + j];
            const avg = sum / slice / 255;
            next.push(Math.max(0.08, Math.min(1, avg * 1.6)));
          }
          setWaveLevels(next);
          rafRef.current = requestAnimationFrame(animate);
        };
        animate();
      } catch {
        /* visualizer optional */
      }

      startedAtRef.current = Date.now();
      setTimeLeft(RECORD_SECS);
      setSubPhase("recording");
      mr.start();
      void acquireWakeLock();

      // Attach video preview after state flips
      if (kind === "video") {
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            videoPreviewRef.current.play().catch(() => {});
          }
        }, 50);
      }

      tickRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const left = Math.max(0, RECORD_SECS - elapsed);
        setTimeLeft(left);
        if (left <= 0) {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }
      }, 200);
    } catch (err) {
      const name = (err as { name?: string })?.name ?? "";
      let title = "Couldn't start recording";
      let description = "Please try again.";
      if (name === "NotAllowedError" || name === "SecurityError") {
        title = kind === "video" ? "Camera/mic access denied" : "Microphone access denied";
        description = "Enable access for this site in your browser settings, then try again.";
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        title = kind === "video" ? "No camera found" : "No microphone found";
        description = "Connect a device and try again.";
      } else if (name === "NotReadableError") {
        title = "Device busy";
        description = "Close other apps using your camera/microphone and try again.";
      } else if (name === "NotSupportedError" || name === "TypeError") {
        setUnsupportedReason("Recording isn't supported on this browser.");
        setPhase("unsupported");
        return;
      }
      toast({ title, description, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    releaseWakeLock();
  };

  const togglePlay = () => {
    const el = recordKind === "video" ? videoPlaybackRef.current : audioElRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const reRecord = () => {
    resetMedia();
    setSubPhase("choose");
  };

  const uploadCurrent = async (): Promise<string> => {
    if (!mediaBlob) throw new Error("No recording to upload");
    if (!sessionId) throw new Error("Missing session");
    const ext = extFromMime(mediaMime);
    const path = `${sessionId}_${step}_${Date.now()}.${ext}`;
    const { data: upData, error: upErr } = await supabase.storage
      .from("pitch-recordings")
      .upload(path, mediaBlob, { contentType: mediaMime, upsert: false });
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from("pitch-recordings").getPublicUrl(upData.path);
    if (!urlData?.publicUrl) throw new Error("Could not resolve recording URL");
    return urlData.publicUrl;
  };

  // Continue from playback for the current step.
  const continueFromPlayback = async () => {
    console.log("[Game3] Continue clicked", { step, hasBlob: !!mediaBlob, sessionId, debugMode });
    if (!mediaBlob) {
      console.warn("[Game3] No media blob — cannot continue");
      return;
    }

    // Debug mode: skip upload + scoring, just advance the local step / route.
    if (debugMode || !sessionId) {
      console.log("[Game3] Debug/no-session: advancing without upload/scoring");
      if (step === "pitch") {
        goToStep("objection2");
      } else {
        fadeNavigate(`/assessment/academic-counselor/filter-2?debug=true${roleQs}`);
      }
      return;
    }

    if (step === "pitch") {
      // Upload the pitch recording, then go directly to objection step
      setPhase("saving");
      let uploadedUrl: string;
      try {
        uploadedUrl = await uploadCurrent();
      } catch (err) {
        console.error("[Game3] Pitch upload failed", err);
        toast({
          title: "Upload failed",
          description: "We couldn't save your recording. Please check your connection and try again, or re-record.",
          variant: "destructive",
        });
        setPhase("step");
        setSubPhase("playback");
        return;
      }
      setResults((r) => ({
        ...r,
        pitch: { kind: recordKind, url: uploadedUrl, duration: recordedSecs },
      }));
      console.log("[Game3] Routing to objection2");
      goToStep("objection2");
      return;
    }

    // Objection2 — upload, persist, continue.
    setPhase("saving");
    let uploadedUrl: string;
    try {
      uploadedUrl = await uploadCurrent();
    } catch (err) {
      console.error("[Game3] Objection upload failed", err);
      toast({
        title: "Upload failed",
        description: "We couldn't save your recording. Please check your connection and try again, or re-record.",
        variant: "destructive",
      });
      setPhase("step");
      setSubPhase("playback");
      return;
    }
    setResults((r) => ({
      ...r,
      objection2: { kind: recordKind, url: uploadedUrl, duration: recordedSecs },
    }));
    console.log("[Game3] Routing to filter-2");
    await persistAndContinue({
      ...results,
      objection2: { kind: recordKind, url: uploadedUrl, duration: recordedSecs },
    });
  };

  const goToStep = (next: Step) => {
    resetMedia();
    setStep(next);
    setSubPhase("choose");
    setPhase("step");
  };

  const persistAndContinue = async (finalResults: Record<Step, RoundResult | null>) => {
    if (!sessionId) return;
    setPhase("saving");
    setSubmitting(true);
    try {
      const { data: row } = await supabase
        .from("assessment_sessions_public")
        .select("scores")
        .eq("id", sessionId)
        .maybeSingle();

      const prev = (row?.scores as Record<string, unknown>) ?? {};
      const merged = {
        ...prev,
        game3: {
          // Initial pitch
          pitch_recording_type: finalResults.pitch?.kind ?? null,
          pitch_recording_url: finalResults.pitch?.url ?? null,
          audio_duration: finalResults.pitch?.duration ?? 0,
          audio_url: finalResults.pitch?.url ?? null,
          transcript: "",
          rubric_scores: null,
          total_score: 0,
          feedback: "Pending manual review.",
          // Objection round
          objection2_recording_type: finalResults.objection2?.kind ?? null,
          objection2_recording_url: finalResults.objection2?.url ?? null,
          objection2_duration: finalResults.objection2?.duration ?? 0,
          timestamp: new Date().toISOString(),
        },
      };

      let saveErr: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabase
          .from("assessment_sessions")
          .update({ scores: merged, current_step: "filter-2" })
          .eq("id", sessionId);
        if (!error) { saveErr = null; break; }
        saveErr = error;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
      if (saveErr) throw saveErr;

      fadeNavigate(`/assessment/academic-counselor/filter-2?session=${sessionId}${roleQs}`);
    } catch {
      toast({
        title: "Couldn't save your progress",
        description: "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      setPhase("step");
      setSubPhase("playback");
    }
  };

  const skipGame3 = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const { data: row } = await supabase
        .from("assessment_sessions_public")
        .select("scores")
        .eq("id", sessionId)
        .maybeSingle();
      const prev = (row?.scores as Record<string, unknown>) ?? {};
      const merged = {
        ...prev,
        game3: {
          audio_duration: 0,
          audio_url: null,
          transcript: "",
          rubric_scores: null,
          total_score: 0,
          feedback: "Skipped — recording not supported on candidate's device.",
          skipped: true,
          timestamp: new Date().toISOString(),
        },
      };
      let skipErr: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabase
          .from("assessment_sessions")
          .update({ scores: merged, current_step: "filter-2" })
          .eq("id", sessionId);
        if (!error) { skipErr = null; break; }
        skipErr = error;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
      if (skipErr) throw skipErr;

      fadeNavigate(`/assessment/academic-counselor/filter-2?session=${sessionId}${roleQs}`);
    } catch {
      toast({
        title: "Couldn't skip the game",
        description: "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // ============ RENDER ============

  if (phase === "context") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.white,
          fontFamily: T.sans,
          color: T.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          ...pageStyle,
        }}
      >
        <style>{`@keyframes g3FadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
        <div
          style={{
            maxWidth: 600,
            width: "100%",
            padding: "32px 8px",
            animation: "g3FadeUp 320ms ease",
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: "0 0 24px",
              color: "#1a1a1a",
              textAlign: "left",
            }}
          >
            Beyond The Student
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#6b6b6b", margin: "0 0 32px", textAlign: "left" }}>
            A parent showed interest but refused due to the ₹48,000 fee and EMI concerns. You have to overcome the
            objection, and close the deal and you have 60 seconds to do the same.
          </p>
          <button
            onClick={() => setPhase("step")}
            style={pillBtnStyle()}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
            }}
          >
            Got it, start
            <ArrowCircle />
          </button>
        </div>
      </div>
    );
  }

  if (phase === "saving") {
    return (
      <CenterMessage style={pageStyle}>
        <style>{`@keyframes g3pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }`}</style>
        <div style={{ animation: "g3pulse 1.6s ease-in-out infinite" }}>
          Saving your response…
        </div>
      </CenterMessage>
    );
  }

  if (phase === "unsupported") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.white,
          fontFamily: T.sans,
          color: T.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          ...pageStyle,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Recording isn't available</div>
          <div style={{ fontSize: 14, color: T.dim, marginBottom: 20, lineHeight: 1.5 }}>
            {unsupportedReason} You can continue without Game 3, but your final score will be lower.
          </div>
          <button
            onClick={skipGame3}
            disabled={submitting}
            style={{
              ...pillBtnStyle(),
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Skipping…" : "Skip and continue"}
            <ArrowCircle />
          </button>
        </div>
      </div>
    );
  }

  // ============ STEP RENDER ============
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.white,
        fontFamily: T.sans,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        ...pageStyle,
      }}
    >
      <style>{`
        @keyframes g3FadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes g3-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
      `}</style>

      <div key={step + subPhase} style={{ maxWidth: 800, width: "100%", animation: "g3FadeUp 280ms ease" }}>
        {/* TOP CONTENT — parent profile or objection card */}
        {step === "pitch" ? (
          <PitchProfileCard />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <button
                onClick={() => setShowParentModal(true)}
                style={{
                  background: T.white,
                  border: `1px solid ${T.text}`,
                  borderRadius: 99,
                  padding: "8px 20px",
                  fontFamily: T.sans,
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.text,
                  cursor: "pointer",
                }}
              >
                View Parent Details
              </button>
            </div>
            <ObjectionCard text={OBJECTION_TEXT.objection2} />
          </>
        )}

        {showParentModal && (
          <div
            onClick={() => setShowParentModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: T.white,
                borderRadius: 12,
                padding: 24,
                maxWidth: 600,
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
            >
              <PitchProfileCard />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={() => setShowParentModal(false)}
                  style={{
                    background: T.text,
                    color: "#fff",
                    border: "none",
                    borderRadius: 99,
                    padding: "8px 20px",
                    fontFamily: T.sans,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHOICE / RECORDING UI */}
        <div style={{ marginTop: 32 }}>
          {subPhase === "choose" && (
            <RecordChoice
              prompt={step === "pitch" ? "Choose how you want to record:" : "Respond to the parent:"}
              onPick={(k) => startRecording(k)}
            />
          )}

          {subPhase === "ready" && (
            <RecordChoice
              prompt={step === "pitch" ? "Choose how you want to record:" : "Respond to the parent:"}
              onPick={(k) => startRecording(k)}
            />
          )}

          {subPhase === "recording" && (
            <RecordingView
              kind={recordKind}
              timeLeft={timeLeft}
              waveLevels={waveLevels}
              videoRef={videoPreviewRef}
              onStop={stopRecording}
            />
          )}

          {subPhase === "playback" && mediaUrl && (
            <PlaybackView
              kind={recordKind}
              mediaUrl={mediaUrl}
              recordedSecs={recordedSecs}
              isPlaying={isPlaying}
              audioRef={audioElRef}
              videoRef={videoPlaybackRef}
              onTogglePlay={togglePlay}
              onPlayingChange={setIsPlaying}
              onReRecord={reRecord}
              onContinue={continueFromPlayback}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SUBCOMPONENTS
// =====================================================

function pillBtnStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    background: T.text,
    color: "#fff",
    border: "none",
    borderRadius: 99,
    paddingLeft: 24,
    paddingRight: 8,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: T.sans,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  };
}

function ArrowCircle() {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        background: T.green,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ArrowRight size={16} color={T.text} strokeWidth={2.5} />
    </span>
  );
}

function CenterMessage({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.white,
        fontFamily: T.sans,
        color: T.dim,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: 500,
        padding: 24,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PitchProfileCard() {
  return (
    <>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.dim,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Parent profile
      </div>
      <div
        style={{
          background: T.off,
          borderRadius: 12,
          padding: 20,
          borderLeft: `3px solid ${T.green}`,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "grid", gap: 6, fontSize: 15, lineHeight: 1.4 }}>
          <div>
            <strong style={{ fontWeight: 600 }}>Name:</strong> Priya Nair
          </div>
          <div>
            <strong style={{ fontWeight: 600 }}>Location:</strong> Kochi, Kerala
          </div>
          <div>
            <strong style={{ fontWeight: 600 }}>Child:</strong> Aarav (Class 10, CBSE)
          </div>
          <div>
            <strong style={{ fontWeight: 600 }}>Current situation:</strong> Scoring 60% in Math, struggling with
            concepts
          </div>
          <div>
            <strong style={{ fontWeight: 600 }}>Goal:</strong> Wants 85%+ in boards (March 2027)
          </div>
        </div>

        <div style={{ height: 1, background: T.border, margin: "12px 0" }} />

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: T.text }}>Demo Summary</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Attended 30-min demo yesterday (6 PM)",
            "Liked the 1-on-1 doubt clearing feature",
            "Asked about teacher quality",
            "Main objection: Price and EMI affordability",
            'Concern: "₹48,000 is expensive and I\'m not sure we can afford the EMI payments - let me think about it."',
          ].map((b) => (
            <li
              key={b}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 14,
                color: T.dim,
                lineHeight: 1.4,
              }}
            >
              <span
                style={{ width: 4, height: 4, borderRadius: "50%", background: T.green, marginTop: 7, flexShrink: 0 }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function ObjectionCard({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 32,
          maxWidth: 600,
          width: "100%",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.dim,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Parent's response
        </div>
        <div style={{ fontSize: 18, color: T.text, lineHeight: 1.5, fontWeight: 500 }}>"{text}"</div>
      </div>
    </div>
  );
}

function RecordChoice({ prompt, onPick }: { prompt: string; onPick: (k: RecordKind) => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, color: T.dim, marginBottom: 24, fontWeight: 400 }}>{prompt}</div>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onPick("voice")}
          style={whitePillStyle()}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.off;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.white;
          }}
        >
          <Mic size={18} color={T.text} />
          Record voice
        </button>
        <button
          onClick={() => onPick("video")}
          style={whitePillStyle()}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.off;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.white;
          }}
        >
          <Video size={18} color={T.text} />
          <span style={{ color: T.text }}>
            Record video <span style={{ color: T.text, fontWeight: 400, opacity: 0.75 }}>(higher success rate)</span>
          </span>
        </button>
      </div>
    </div>
  );
}

function whitePillStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: T.white,
    color: T.text,
    border: `2px solid ${T.text}`,
    borderRadius: 999,
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 500,
    fontFamily: T.sans,
    cursor: "pointer",
    transition: "background 150ms ease",
  };
}

function RecordingView({
  kind,
  timeLeft,
  waveLevels,
  videoRef,
  onStop,
}: {
  kind: RecordKind;
  timeLeft: number;
  waveLevels: number[];
  videoRef: React.RefObject<HTMLVideoElement>;
  onStop: () => void;
}) {
  const timerRed = timeLeft <= 10;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span
          aria-hidden
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: T.red,
            animation: "g3-pulse 1.1s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.red,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Rec
        </span>
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: timerRed ? T.red : T.text,
          letterSpacing: "-0.02em",
          marginBottom: 16,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtTime(timeLeft)}
      </div>

      {kind === "video" ? (
        <>
          <div
            style={{
              margin: "0 auto 12px",
              width: "100%",
              maxWidth: 400,
              aspectRatio: "4 / 3",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              border: `2px solid ${T.border}`,
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              height: 30,
              marginBottom: 16,
            }}
            aria-label="Audio level"
          >
            {waveLevels.map((l, i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: `${Math.max(4, Math.round(l * 28))}px`,
                  background: T.green,
                  borderRadius: 2,
                  transition: "height 80ms linear",
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            height: 50,
            marginBottom: 16,
          }}
          aria-hidden
        >
          {waveLevels.map((l, i) => (
            <span
              key={i}
              style={{
                width: 3,
                height: `${Math.max(6, Math.round(l * 50))}px`,
                background: T.green,
                borderRadius: 2,
                transition: "height 80ms linear",
              }}
            />
          ))}
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 500, color: T.dim, marginBottom: 16 }}>
        {kind === "video" ? "Recording video… Speak clearly" : "Recording… Speak clearly"}
      </div>

      <button
        onClick={onStop}
        aria-label="Stop recording"
        style={{
          minHeight: 56,
          minWidth: 160,
          background: T.text,
          color: "#fff",
          border: "none",
          borderRadius: 99,
          padding: "0 28px",
          fontSize: 16,
          fontWeight: 600,
          fontFamily: T.sans,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
        }}
      >
        Stop recording
      </button>
    </div>
  );
}

function PlaybackView({
  kind,
  mediaUrl,
  recordedSecs,
  isPlaying,
  audioRef,
  videoRef,
  onTogglePlay,
  onPlayingChange,
  onReRecord,
  onContinue,
}: {
  kind: RecordKind;
  mediaUrl: string;
  recordedSecs: number;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onTogglePlay: () => void;
  onPlayingChange: (b: boolean) => void;
  onReRecord: () => void;
  onContinue: () => void;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 500, color: T.dim, marginBottom: 16 }}>
        Recorded: {fmtTime(recordedSecs)}
      </div>

      {kind === "video" ? (
        <div
          style={{
            margin: "0 auto 20px",
            width: "100%",
            maxWidth: 400,
            aspectRatio: "4 / 3",
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${T.border}`,
          }}
        >
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            playsInline
            onPlay={() => onPlayingChange(true)}
            onPause={() => onPlayingChange(false)}
            onEnded={() => onPlayingChange(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <>
          <audio ref={audioRef} src={mediaUrl} onEnded={() => onPlayingChange(false)} style={{ display: "none" }} />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: T.off,
              border: `1px solid ${T.border}`,
              borderRadius: 99,
              padding: "8px 16px 8px 8px",
              marginBottom: 20,
            }}
          >
            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: T.green,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {isPlaying ? (
                <Pause size={20} color={T.text} strokeWidth={2.5} />
              ) : (
                <Play size={20} color={T.text} strokeWidth={2.5} style={{ marginLeft: 2 }} />
              )}
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: T.dim }}>
              {isPlaying ? "Playing your recording" : "Tap to listen"}
            </span>
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={onReRecord}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: T.white,
            color: T.dim,
            border: `2px solid ${T.border}`,
            borderRadius: 99,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: T.sans,
            cursor: "pointer",
          }}
        >
          <RotateCcw size={16} />
          Re-record
        </button>
        <button
          onClick={onContinue}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: T.text,
            color: "#fff",
            border: "none",
            borderRadius: 99,
            paddingLeft: 24,
            paddingRight: 8,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 15,
            fontWeight: 500,
            fontFamily: T.sans,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          Continue
          <ArrowCircle />
        </button>
      </div>
    </div>
  );
}
