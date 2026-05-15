import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";
import { useToast } from "@/hooks/use-toast";
import { FilterPageShell, PillButton } from "@/components/assessment/FilterPageShell";

export default function AcademicCounselorFilter1() {
  const [params] = useSearchParams();
  const sessionId = params.get("session") ?? "";
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const { toast } = useToast();

  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canContinue =
    (choice === "no") || (choice === "yes" && duration.trim().length > 0);

  const handleContinue = async () => {
    if (!sessionId) {
      fadeNavigate(`/assessment/academic-counselor/game-2`);
      return;
    }
    setSubmitting(true);
    try {
      await supabase
        .from("assessment_sessions")
        .update({
          prior_experience: choice === "yes",
          prior_experience_duration: choice === "yes" ? duration.trim() : null,
          current_step: "game-2",
        })
        .eq("id", sessionId);
      fadeNavigate(`/assessment/academic-counselor/game-2?session=${sessionId}${roleQs}`);
    } catch {
      toast({ title: "Couldn't save", description: "Moving on anyway.", variant: "destructive" });
      fadeNavigate(`/assessment/academic-counselor/game-2?session=${sessionId}${roleQs}`);
    }
  };

  return (
    <FilterPageShell
      question="A question about your previous experience"
      subtitle="Have you worked in sales, counseling, or customer support before?"
      onContinue={handleContinue}
      canContinue={canContinue}
      submitting={submitting}
      pageStyle={pageStyle}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
        <PillButton active={choice === "yes"} onClick={() => setChoice("yes")}>
          Yes, I worked in sales/counseling/customer support
        </PillButton>
        {choice === "yes" && (
          <input
            autoFocus
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="How long? (e.g., 6 months, 2 years)"
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "14px 20px",
              fontSize: 16,
              fontFamily: "inherit",
              color: "#1a1a1a",
              border: "1.5px solid #e5e5e5",
              borderRadius: 12,
              outline: "none",
            }}
          />
        )}
        <PillButton active={choice === "no"} onClick={() => { setChoice("no"); setDuration(""); }}>
          No, this would be my first customer-facing role
        </PillButton>
      </div>
    </FilterPageShell>
  );
}
