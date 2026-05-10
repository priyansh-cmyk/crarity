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
    const {
      session_id,
      candidate_email,
      candidate_name,
      employer_id,
      scheduled_at,
      duration_minutes,
      interview_type,
      google_meet_link,
      notes,
      is_reschedule = false,
    } = await req.json();

    // Use email passed directly from client (avoids service-role DB lookup issues)
    // Fall back to DB lookup if not provided (backwards compat)
    let recipientEmail = candidate_email as string | undefined;
    let candidateName = candidate_name as string | undefined;
    let companyName = "A Company";

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
      recipientEmail = recipientEmail || (sess as { email?: string } | null)?.email;
      candidateName = candidateName || (sess as { name?: string } | null)?.name || recipientEmail?.split("@")[0];

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, full_name")
        .eq("id", employer_id)
        .maybeSingle();
      companyName =
        (profile as { company_name?: string; full_name?: string } | null)?.company_name ||
        (profile as { company_name?: string; full_name?: string } | null)?.full_name ||
        "A Company";
    } else {
      // Still fetch company name for the employer
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, full_name")
        .eq("id", employer_id)
        .maybeSingle();
      companyName =
        (profile as { company_name?: string; full_name?: string } | null)?.company_name ||
        (profile as { company_name?: string; full_name?: string } | null)?.full_name ||
        "A Company";
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No candidate email found" }),
        { status: 400, headers: corsHeaders }
      );
    }

    candidateName = candidateName || recipientEmail.split("@")[0];

    // Format date in IST
    const date = new Date(scheduled_at);
    const dateStr = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY secret not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const subject = is_reschedule
      ? `Interview Rescheduled — ${companyName}`
      : `Interview Request from ${companyName} 🎉`;

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
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">
        ${is_reschedule ? "Your interview has been rescheduled" : "You have an interview request! 🎉"}
      </h1>
      <p style="font-size:15px;color:#6b6b6b;margin:0 0 28px;line-height:1.5;">
        Hi ${candidateName}, <strong style="color:#1a1a1a;">${companyName}</strong>
        ${is_reschedule ? " has rescheduled your interview." : " wants to interview you."}
      </p>

      <!-- Details card -->
      <div style="background:#f7f6f3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b6b6b;width:110px;vertical-align:top;">Company</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${companyName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b6b6b;vertical-align:top;">Date &amp; Time</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${dateStr} IST</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b6b6b;vertical-align:top;">Duration</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${duration_minutes} minutes</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b6b6b;vertical-align:top;">Type</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${interview_type}</td>
          </tr>
          ${google_meet_link ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b6b6b;vertical-align:top;">Meet Link</td>
            <td style="padding:6px 0;font-size:13px;">
              <a href="${google_meet_link}" style="color:#1a1a1a;font-weight:600;word-break:break-all;">${google_meet_link}</a>
            </td>
          </tr>` : ""}
          ${notes ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b6b6b;vertical-align:top;">Notes</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;">${notes}</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- CTA -->
      <a href="https://www.crarity.com/candidate/dashboard"
         style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:99px;font-weight:600;font-size:14px;">
        View on Dashboard →
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
        subject,
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
    console.error("notify-interview error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
