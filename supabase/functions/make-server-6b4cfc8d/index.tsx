import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-6b4cfc8d/health", (c) => {
  return c.json({ status: "ok" });
});

// POST /feedback — store submission in KV and send email notification via Resend
app.post("/make-server-6b4cfc8d/feedback", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, feedback } = body;

    if (!email || !email.trim()) {
      return c.json({ error: "Email address is required." }, 400);
    }
    if (!feedback || !feedback.trim()) {
      return c.json({ error: "Feedback message is required." }, 400);
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const feedbackId = `feedback_${timestamp}_${randomStr}`;

    const feedbackData = {
      name: name?.trim() || "Anonymous",
      email: email.trim(),
      feedback: feedback.trim(),
      timestamp,
      source: "delaneys_world",
    };

    await kv.set(feedbackId, feedbackData);
    console.log(`Feedback stored with key: ${feedbackId}`);

    // Send email notification via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const displayName = feedbackData.name !== "Anonymous" ? feedbackData.name : "Anonymous visitor";
      const submittedAt = new Date(timestamp).toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "full",
        timeStyle: "short",
      });

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px; color: #1e40af;">📬 New Message — Delaney's World</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280;">Received ${submittedAt} ET</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #374151; width: 72px; vertical-align: top;">From</td>
              <td style="padding: 10px 0; font-size: 14px; color: #111827; vertical-align: top;">${displayName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #374151; vertical-align: top;">Email</td>
              <td style="padding: 10px 0; font-size: 14px; vertical-align: top;">
                <a href="mailto:${feedbackData.email}" style="color: #2563eb; text-decoration: none;">${feedbackData.email}</a>
              </td>
            </tr>
          </table>

          <div style="background: #f0f7ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 18px 20px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${feedbackData.feedback}</p>
          </div>

          <p style="margin-top: 28px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            Feedback ID: ${feedbackId} &nbsp;·&nbsp; Delaney's World &nbsp;·&nbsp; laneysworld.com
          </p>
        </div>
      `;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Delaney's World <updates@laneysworld.com>",
          to: ["kallen1286@gmail.com"],
          reply_to: feedbackData.email,
          subject: `New message from ${displayName} — Delaney's World`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.log(`Resend API error (non-fatal): ${resendError}`);
      } else {
        console.log(`Notification email sent for feedback ${feedbackId}`);
      }
    } else {
      console.log("RESEND_API_KEY not set — skipping email notification.");
    }

    return c.json({
      success: true,
      message: "Thank you for your message!",
      feedbackId,
    });
  } catch (error) {
    console.log(`Error in POST /make-server-6b4cfc8d/feedback: ${error}`);
    return c.json({ error: `Failed to submit feedback: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
