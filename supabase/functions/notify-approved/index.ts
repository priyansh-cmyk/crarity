import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id, candidate_email, candidate_name } = await req.json();

    let recipientEmail = candidate_email as string | undefined;
    let candidateName = candidate_name as string | undefined;

    // Fall back to DB lookup if not passed directly
    if (!recipientEmail || !candidateName) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: sess } = await supabase
        .from("assessment_sessions")
        .select("email, name")
        .eq("id", session_id)
        .maybeSingle();
      recipientEmail = recipientEmail || (sess as any)?.email;
      candidateName = candidateName || (sess as any)?.name || recipientEmail?.split("@")[0];
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No candidate email found" }),
        { status: 400, headers: corsHeaders }
      );
    }

    candidateName = candidateName || recipientEmail.split("@")[0];

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:#C5E831;padding:28px 40px;">
      <span style="font-size:22px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px;">Crarity</span>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <div style="font-size:36px;margin-bottom:16px;">🎉</div>
      <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 10px;letter-spacing:-0.5px;">
        You're in!
      </h1>
      <p style="font-size:15px;color:#6b6b6b;margin:0 0 28px;line-height:1.6;">
        Hi ${candidateName}, your Crarity profile has been reviewed and approved.
        You're now part of our verified talent pool.
      </p>

      <!-- What this means -->
      <div style="background:#f7f6f3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:14px;letter-spacing:0.02em;text-transform:uppercase;">What happens next</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:20px;height:20px;border-radius:50%;background:#C5E831;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:11px;font-weight:700;color:#1a1a1a;">1</div>
            <div style="font-size:14px;color:#1a1a1a;line-height:1.5;">Employers on Crarity can now view your profile and assessment results.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:20px;height:20px;border-radius:50%;background:#C5E831;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:11px;font-weight:700;color:#1a1a1a;">2</div>
            <div style="font-size:14px;color:#1a1a1a;line-height:1.5;">When a company wants to meet you, they'll send an interview invitation directly to your dashboard.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:20px;height:20px;border-radius:50%;background:#C5E831;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:11px;font-weight:700;color:#1a1a1a;">3</div>
            <div style="font-size:14px;color:#1a1a1a;line-height:1.5;">Most candidates receive their first interview invitation within 1–2 weeks. Keep your status updated so employers know you're available.</div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <a href="https://www.crarity.com/candidate/dashboard"
         style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:99px;font-weight:600;font-size:14px;">
        View your dashboard →
      </a>

      <p style="font-size:12px;color:#bbb;margin-top:32px;margin-bottom:0;line-height:1.6;">
        You're receiving this because you completed a Crarity assessment.<br>
        <a href="https://www.crarity.com" style="color:#bbb;">crarity.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Crarity <notifications@crarity.com>",
        to: [recipientEmail],
        subject: "You're in! Your Crarity profile is now live 🎉",
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend error:", detail);
      return new Response(
        JSON.stringify({ error: "Email send failed", detail }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-approved error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
