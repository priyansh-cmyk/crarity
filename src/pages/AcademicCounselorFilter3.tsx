import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";
import { useToast } from "@/hooks/use-toast";
import { FilterPageShell, PillButton } from "@/components/assessment/FilterPageShell";

const OPTIONS = [
  { id: "immediately", label: "Immediately" },
  { id: "15_days", label: "Within 15 days" },
  { id: "1_month", label: "Within 1 month" },
  { id: "2_plus_months", label: "2+ months" },
];

export default function AcademicCounselorFilter3() {
  const [params] = useSearchParams();
  const sessionId = params.get("session") ?? "";
  const roleId = params.get("role");
  const roleQs = roleId ? `&role=${roleId}` : "";
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const { toast } = useToast();

  const [choice, setChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!sessionId) {
      fadeNavigate(`/assessment/academic-counselor/results`);
      return;
    }
    setSubmitting(true);
    try {
      await supabase
        .from("assessment_sessions")
        .update({
          start_timeline: choice,
          current_step: "results",
        })
        .eq("id", sessionId);
      fadeNavigate(`/assessment/academic-counselor/results?session=${sessionId}${roleQs}`);
    } catch {
      toast({ title: "Couldn't save", description: "Moving on anyway.", variant: "destructive" });
      fadeNavigate(`/assessment/academic-counselor/results?session=${sessionId}${roleQs}`);
    }
  };

  return (
    <FilterPageShell
      question="How soon can you start if selected?"
      onContinue={handleContinue}
      canContinue={choice !== null}
      submitting={submitting}
      pageStyle={pageStyle}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch" }}>
        {OPTIONS.map((opt) => (
          <PillButton key={opt.id} active={choice === opt.id} onClick={() => setChoice(opt.id)}>
            {opt.label}
          </PillButton>
        ))}
      </div>
    </FilterPageShell>
  );
}
