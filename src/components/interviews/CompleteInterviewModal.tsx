import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
};

export default function CompleteInterviewModal({
  open,
  onClose,
  interviewId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  onSaved: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from("interviews")
      .update({ status: "completed", feedback: feedback || null })
      .eq("id", interviewId);
    setSubmitting(false);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success("Interview marked complete");
    setFeedback("");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" style={{ fontFamily: T.sans, padding: 28, borderRadius: 20 }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: 22, fontWeight: 600, color: T.text }}>
            How did the interview go?
          </DialogTitle>
        </DialogHeader>
        <textarea
          autoFocus
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your feedback or notes (optional)"
          style={{
            width: "100%",
            minHeight: 120,
            padding: 14,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            fontSize: 14,
            fontFamily: T.sans,
            outline: "none",
            marginTop: 8,
            resize: "vertical",
          }}
          maxLength={2000}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
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
            disabled={submitting}
            style={{
              background: T.text, color: "#fff", border: "none",
              padding: "10px 22px", borderRadius: 99, fontSize: 14, fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer", fontFamily: T.sans,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Saving…" : "Mark complete"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
