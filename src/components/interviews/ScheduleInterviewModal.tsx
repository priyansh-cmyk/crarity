import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMeetLink, formatScheduledAt } from "@/lib/meet";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  green: "#C5E831",
  off: "#fafaf8",
};

const TIME_SLOTS = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      out.push({ value, label: `${hh}:${String(m).padStart(2, "0")} ${ampm}` });
    }
  }
  return out;
})();

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

const TYPES = ["Initial Screening", "Final Round"] as const;

export default function ScheduleInterviewModal({
  open,
  onClose,
  candidateName,
  sessionId,
  employerId,
  existing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  candidateName: string;
  sessionId: string;
  employerId: string;
  existing?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    interview_type: string;
    notes: string | null;
  } | null;
  onSaved: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<(typeof TYPES)[number]>("Initial Screening");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && existing) {
      const d = new Date(existing.scheduled_at);
      setDate(d);
      setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      setDuration(existing.duration_minutes);
      setType(existing.interview_type as (typeof TYPES)[number]);
      setNotes(existing.notes ?? "");
    } else if (open) {
      setDate(undefined);
      setTime("10:00");
      setDuration(30);
      setType("Initial Screening");
      setNotes("");
    }
  }, [open, existing]);

  const submit = async () => {
    if (!date) {
      toast.error("Pick a date");
      return;
    }
    setSubmitting(true);
    const [hh, mm] = time.split(":").map(Number);
    const scheduled = new Date(date);
    scheduled.setHours(hh, mm, 0, 0);

    if (existing) {
      const { error } = await supabase
        .from("interviews")
        .update({
          scheduled_at: scheduled.toISOString(),
          duration_minutes: duration,
          interview_type: type,
          notes: notes || null,
          status: "scheduled",
        })
        .eq("id", existing.id);
      setSubmitting(false);
      if (error) {
        toast.error(`Failed to reschedule: ${error.message}`);
        return;
      }
      toast.success(`Interview rescheduled for ${formatScheduledAt(scheduled.toISOString())}`);
      // Notify candidate of reschedule (best-effort — don't block UI)
      supabase.functions.invoke("notify-interview", {
        body: {
          session_id: sessionId,
          employer_id: employerId,
          scheduled_at: scheduled.toISOString(),
          duration_minutes: duration,
          interview_type: type,
          google_meet_link: null, // meet link preserved from original interview row
          notes: notes || null,
          is_reschedule: true,
        },
      }).catch(() => {/* silent — email failure shouldn't break the UI */});
    } else {
      const meet = generateMeetLink();
      const { error } = await supabase.from("interviews").insert({
        session_id: sessionId,
        employer_id: employerId,
        scheduled_at: scheduled.toISOString(),
        duration_minutes: duration,
        interview_type: type,
        notes: notes || null,
        google_meet_link: meet,
      });
      if (!error) {
        // Mark assessment session as interview_scheduled (best-effort)
        await supabase
          .from("assessment_sessions")
          .update({ status: "interview_scheduled" })
          .eq("id", sessionId);
        // Email the candidate (best-effort)
        supabase.functions.invoke("notify-interview", {
          body: {
            session_id: sessionId,
            employer_id: employerId,
            scheduled_at: scheduled.toISOString(),
            duration_minutes: duration,
            interview_type: type,
            google_meet_link: meet,
            notes: notes || null,
            is_reschedule: false,
          },
        }).catch(() => {/* silent */});
      }
      setSubmitting(false);
      if (error) {
        toast.error(`Failed to schedule: ${error.message}`);
        return;
      }
      toast.success(`Interview scheduled for ${formatScheduledAt(scheduled.toISOString())}`);
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl" style={{ fontFamily: T.sans, padding: 28, borderRadius: 20 }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>
            {existing ? "Reschedule" : "Schedule"} Interview with {candidateName}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {/* Date + Time row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-[44px]", !date && "text-muted-foreground")}
                    style={{ borderColor: T.border, fontFamily: T.sans, fontSize: 14 }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return d < today;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field label="Time">
              <select value={time} onChange={(e) => setTime(e.target.value)} style={selectStyle}>
                {TIME_SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Duration">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={selectStyle}
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Interview type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
                style={selectStyle}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or prep materials"
              style={{
                ...inputBase,
                height: 52,
                paddingTop: 14,
                resize: "vertical",
                minHeight: 52,
              }}
              maxLength={1000}
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              background: "#fff", color: T.text, border: `1px solid ${T.border}`,
              padding: "10px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: T.sans,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !date}
            style={{
              background: T.text, color: "#fff", border: "none",
              padding: "10px 22px", borderRadius: 99, fontSize: 14, fontWeight: 500,
              cursor: submitting || !date ? "not-allowed" : "pointer",
              fontFamily: T.sans,
              opacity: submitting || !date ? 0.5 : 1,
            }}
          >
            {submitting ? "Saving…" : existing ? "Save changes" : "Schedule"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, color: T.dim, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  fontSize: 14,
  background: "#fff",
  color: T.text,
  fontFamily: T.sans,
  outline: "none",
};

const selectStyle: React.CSSProperties = { ...inputBase };
