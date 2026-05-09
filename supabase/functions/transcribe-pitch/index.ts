// Transcribe an audio pitch via Lovable AI Gateway (Gemini multimodal)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audio_base64, mime_type } = await req.json();
    if (!audio_base64 || typeof audio_base64 !== "string") {
      return new Response(JSON.stringify({ error: "audio_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mt = typeof mime_type === "string" && mime_type ? mime_type : "audio/webm";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You transcribe spoken audio verbatim. Return ONLY the spoken words as plain text, no commentary, no timestamps, no speaker labels. If the audio is unclear or silent, return an empty string.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe the speech in this audio verbatim." },
              {
                type: "input_audio",
                input_audio: { data: audio_base64, format: mt.includes("webm") ? "webm" : mt.includes("mp4") ? "mp4" : mt.includes("wav") ? "wav" : "webm" },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Transcription gateway error:", aiResp.status, t);
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
      return new Response(JSON.stringify({ error: "Transcription failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const transcript: string =
      data.choices?.[0]?.message?.content?.toString().trim() ?? "";

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-pitch error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
