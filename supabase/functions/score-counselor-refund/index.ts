// Score Academic Counselor Game 4 (refund handling) via Google Gemini API tool calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are evaluating an Academic Counselor candidate's WhatsApp message response to a refund request.

CONTEXT:
- Parent: Ramesh Kumar (Jaipur, Rajasthan). Daughter Priya, Class 11 Science.
- Enrolled in NEET Foundation Course 10 days ago, paid ₹50,000.
- Daughter attended 3 live classes + 2 doubt sessions.
- Parent says daughter doesn't like the classes and wants a FULL REFUND.
- Company policy: full refund only within 7 days. Parent is past the window (10 days).
- Parent threatens negative reviews if refund denied.
- The candidate must reply professionally with empathy AND policy adherence.

Score the RESPONSE on 5 dimensions:

1. empathy (0-2)
   - 2: Genuinely acknowledges parent's concern AND daughter's experience
   - 1: Mentions concern but feels robotic
   - 0: Ignores feelings or dismissive

2. policy_communication (0-2)
   - 2: Clearly explains 7-day policy with kindness (firm but not defensive)
   - 1: Mentions policy but unclear or apologetic
   - 0: Doesn't explain policy OR caves and grants full refund

3. alternatives (0-3)
   - 3: Offers SPECIFIC alternatives (different teacher, course swap, pause enrollment, partial credit, extra doubt sessions)
   - 2: Offers alternatives but vague
   - 1: Mentions "let's find a solution" without specifics
   - 0: No alternatives offered

4. threat_handling (0-2)
   - 2: Stays calm, doesn't engage the threat, focuses on solving the problem
   - 1: Acknowledges threat but handles awkwardly
   - 0: Defensive, confrontational, or scared into giving refund

5. professionalism (0-1)
   - 1: Professional, warm, solution-focused (not desperate or pushy)
   - 0: Unprofessional, rude, or overly desperate

PENALTIES:
- Granting a FULL refund despite policy: deduct 1 from total
- Aggressive or defensive about the threat: already reflected in threat_handling

If response is empty or nonsense, score everything 0.

total_score = (sum of the five rubrics) / 10 * 25, then apply penalty (penalty = 2.5 if full refund granted despite policy), clamped to [0,25] and rounded.
feedback: 1-2 sentences of actionable feedback.

Use the score_refund tool to return your evaluation.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { response: candidateResponse } = await req.json();

    if (typeof candidateResponse !== "string") {
      return new Response(JSON.stringify({ error: "response is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Candidate's WhatsApp response:\n\n"""${candidateResponse.trim()}"""` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_refund",
              description: "Return rubric scores and feedback",
              parameters: {
                type: "object",
                properties: {
                  empathy: { type: "integer", minimum: 0, maximum: 2 },
                  policy_communication: { type: "integer", minimum: 0, maximum: 2 },
                  alternatives: { type: "integer", minimum: 0, maximum: 3 },
                  threat_handling: { type: "integer", minimum: 0, maximum: 2 },
                  professionalism: { type: "integer", minimum: 0, maximum: 1 },
                  total_score: { type: "integer", minimum: 0, maximum: 25 },
                  feedback: { type: "string" },
                },
                required: [
                  "empathy",
                  "policy_communication",
                  "alternatives",
                  "threat_handling",
                  "professionalism",
                  "total_score",
                  "feedback",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_refund" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI scoring failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call returned:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "No structured score returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    const rubricSum =
      (args.empathy ?? 0) +
      (args.policy_communication ?? 0) +
      (args.alternatives ?? 0) +
      (args.threat_handling ?? 0) +
      (args.professionalism ?? 0);
    args.total_score = Math.max(0, Math.min(25, Math.round((rubricSum / 10) * 25)));

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-counselor-refund error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
