// Score Academic Counselor Game 2 answer using Lovable AI gateway with tool calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are evaluating an Academic Counselor candidate's written response to a parent's question.

PARENT'S QUESTION:
"My son is in Class 12 right now, scoring around 55% in Biology. His school teacher says his basics are weak from Class 11.

I saw your course is 18 months and starts in July. But his NEET exam is in May 2027 - that's only 10 months away!

Also, we already paid ₹40,000 for Aakash offline coaching last year, but he stopped going after 2 months because he couldn't keep up.

Is your online program really going to be different? And can he even catch up in 10 months with weak basics?"

COURSE FACTS THE CANDIDATE COULD USE:
- Complete NCERT-based NEET syllabus coverage
- Physics, Chemistry, Biology (Botany + Zoology)
- 300+ hours of live teaching
- Access to recorded lectures for revision
- 24/7 WhatsApp support from subject experts
- Weekly 1-on-1 doubt sessions with teachers
- Dedicated doubt clearing classes every Sunday
- 40+ full-length mock tests (online + offline mode)
- 15,000+ practice questions with solutions
- Success Rate: 82% of 2026 batch qualified NEET (All India average: 56%)
- Full refund if student scores below 75 percentile in NEET qualifying exam

Score the response on 5 dimensions, 0–2 points each:

1. foundation_concern (0-2)
   - 2: Addresses weak basics with specific solution (doubt clearing, foundation module, 1-on-1 sessions)
   - 1: Mentions it vaguely
   - 0: Ignores the weak basics issue

2. timeline_reality (0-2)
   - 2: Honest about timeline (18-month course but focused prep possible, or suggests crash course instead)
   - 1: Glosses over timeline mismatch
   - 0: Pretends 18-month course fits 10-month window

3. trust_building (0-2)
   - 2: Acknowledges Aakash failure, differentiates without badmouthing, explains what will be different
   - 1: Mentions difference but doesn't build trust
   - 0: Ignores previous failure or badmouths Aakash

4. online_skepticism (0-2)
   - 2: Addresses online concern with specifics (live interaction, doubt clearing, engagement tactics)
   - 1: Generic "online is good" statement
   - 0: Doesn't address online concern

5. empathy_realism (0-2)
   - 2: Shows empathy for parent's worry, sets realistic expectations, doesn't oversell
   - 1: Professional but not empathetic
   - 0: Pure sales pitch, oversells capabilities

total_score = sum of the five (0–10).
feedback: 1–2 sentences of actionable feedback.

Use the score_response tool to return your evaluation.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answer } = await req.json();

    if (!answer || typeof answer !== "string" || answer.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Answer is required (min 10 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Candidate's response:\n\n"""${answer.trim()}"""` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_response",
              description: "Return rubric scores and feedback",
              parameters: {
                type: "object",
                properties: {
                  foundation_concern: { type: "integer", minimum: 0, maximum: 2 },
                  timeline_reality: { type: "integer", minimum: 0, maximum: 2 },
                  trust_building: { type: "integer", minimum: 0, maximum: 2 },
                  online_skepticism: { type: "integer", minimum: 0, maximum: 2 },
                  empathy_realism: { type: "integer", minimum: 0, maximum: 2 },
                  total_score: { type: "integer", minimum: 0, maximum: 10 },
                  feedback: { type: "string" },
                },
                required: [
                  "foundation_concern",
                  "timeline_reality",
                  "trust_building",
                  "online_skepticism",
                  "empathy_realism",
                  "total_score",
                  "feedback",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_response" } },
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
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
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
    // Recompute total to be safe
    const recomputed =
      (args.foundation_concern ?? 0) +
      (args.timeline_reality ?? 0) +
      (args.trust_building ?? 0) +
      (args.online_skepticism ?? 0) +
      (args.empathy_realism ?? 0);
    args.total_score = recomputed;

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-counselor-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
