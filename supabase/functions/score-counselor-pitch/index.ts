// Score Academic Counselor Game 3 (parent call pitch) via Google Gemini API tool calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are evaluating an Academic Counselor candidate's 60-second phone pitch (transcript) to parent Priya Nair.

CONTEXT:
- Parent: Priya Nair (Kochi, Kerala). Child Aarav, Class 10 CBSE, scoring 60% in Math.
- Goal: 85%+ in board exams (March 2027).
- Parent attended a 30-min demo yesterday (6 PM).
- Parent liked 1-on-1 doubt clearing, asked about teacher quality.
- Concern: "₹45,000 is expensive. Let me think."
- The candidate's job is to call back and CLOSE the enrollment.

Score the TRANSCRIPT on 5 dimensions:

1. opening_context (0-2)
   - 2: Strong opening with empathy/context (references yesterday's demo, warm personalised intro)
   - 1: Generic opening
   - 0: Abrupt or no opening

2. price_handling (0-3)
   - 3: Addresses ₹45k with value framing (per-day cost, ROI, board outcome) AND empathy
   - 2: Mentions value but weakly
   - 1: Ignores price or just offers a discount
   - 0: Doesn't address the concern at all

3. urgency (0-2)
   - 2: Creates legitimate urgency (batch filling, board exam timeline, early-bird, syllabus runway)
   - 1: Generic urgency ("limited time")
   - 0: No urgency

4. cta (0-2)
   - 2: Specific CTA (enroll today, book follow-up call at a specific time, send payment link)
   - 1: Vague CTA ("let me know")
   - 0: No clear next step

5. tone (0-1)
   - 1: Confident, clear, warm (not robotic or pushy)
   - 0: Hesitant, unclear, or aggressive

IMPORTANT:
- Score based on TRANSCRIPT quality.
- Ignore filler words (um, uh) unless excessive.
- If the transcript is empty or nearly silent, score everything 0 with feedback explaining.

total_score = (sum of the five rubrics) / 10 * 25 (max 25, rounded to nearest integer).
feedback: 1-2 sentences of actionable feedback.

Use the score_pitch tool to return your evaluation.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();

    if (typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript is required" }), {
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
          { role: "user", content: `Candidate's transcript:\n\n"""${transcript.trim()}"""` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_pitch",
              description: "Return rubric scores and feedback",
              parameters: {
                type: "object",
                properties: {
                  opening_context: { type: "integer", minimum: 0, maximum: 2 },
                  price_handling: { type: "integer", minimum: 0, maximum: 3 },
                  urgency: { type: "integer", minimum: 0, maximum: 2 },
                  cta: { type: "integer", minimum: 0, maximum: 2 },
                  tone: { type: "integer", minimum: 0, maximum: 1 },
                  total_score: { type: "integer", minimum: 0, maximum: 25 },
                  feedback: { type: "string" },
                },
                required: [
                  "opening_context",
                  "price_handling",
                  "urgency",
                  "cta",
                  "tone",
                  "total_score",
                  "feedback",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_pitch" } },
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
      (args.opening_context ?? 0) +
      (args.price_handling ?? 0) +
      (args.urgency ?? 0) +
      (args.cta ?? 0) +
      (args.tone ?? 0);
    args.total_score = Math.round((rubricSum / 10) * 25);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-counselor-pitch error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
