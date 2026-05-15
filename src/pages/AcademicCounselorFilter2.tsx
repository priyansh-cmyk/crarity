import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFadeNavigate } from "@/hooks/useFadeNavigate";
import { useToast } from "@/hooks/use-toast";
import { FilterPageShell, PillButton } from "@/components/assessment/FilterPageShell";

export default function AcademicCounselorFilter2() {
  const [params] = useSearchParams();
  const sessionId = params.get("session") ?? "";
  const roleId = params.get("role_id");
  const roleQs = roleId ? `&role_id=${roleId}` : "";
  const { fadeNavigate, pageStyle } = useFadeNavigate();
  const { toast } = useToast();

  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!sessionId) {
      fadeNavigate(`/assessment/academic-counselor/game-4`);
      return;
    }
    setSubmitting(true);
    try {
      await supabase
        .from("assessment_sessions")
        .update({
          weekend_availability: choice === "yes",
          current_step: "game-4",
        })
        .eq("id", sessionId);
      fadeNavigate(`/assessment/academic-counselor/game-4?session=${sessionId}${roleQs}`);
    } catch {
      toast({ title: "Couldn't save", description: "Moving on anyway.", variant: "destructive" });
      fadeNavigate(`/assessment/academic-counselor/game-4?session=${sessionId}${roleQs}`);
    }
  };

  return (
    <FilterPageShell
      question="A question about weekend availability"
      subtitle="This role sometimes requires weekend work during new program launches or enrollment drives - would you be available if needed in such rare cases?"
      onContinue={handleContinue}
      canContinue={choice !== null}
      submitting={submitting}
      pageStyle={pageStyle}
    >
      <div style={{ display: "flex", flexDirection: "row", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <PillButton active={choice === "yes"} onClick={() => setChoice("yes")}>
          Yes
        </PillButton>
        <PillButton active={choice === "no"} onClick={() => setChoice("no")}>
          No
        </PillButton>
      </div>
    </FilterPageShell>
  );
}
