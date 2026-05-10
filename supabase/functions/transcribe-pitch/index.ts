// Transcribe an audio pitch via Google Gemini API (native multimodal)
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mt = typeof mime_type === "string" && mime_type ? mime_type : "audio/webm";

    // Use Gemini native API — supports inline audio via inline_data
    const aiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Transcribe the speech in this audio verbatim. Return ONLY the spoken words as plain text — no commentary, no timestamps, no speaker labels. If the audio is unclear or silent, return an empty string.",
                },
                {
                  inline_data: { mime_type: mt, data: audio_base64 },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Gemini transcription error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
          status: 429,
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
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

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
