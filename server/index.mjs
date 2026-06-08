import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/feedback', async (req, res) => {
  try {
    const { name, email, feedback } = req.body ?? {};

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!feedback?.trim()) {
      return res.status(400).json({ error: 'Feedback message is required.' });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const feedbackId = `feedback_${timestamp}_${randomStr}`;

    const displayName = name?.trim() || 'Anonymous';
    const senderEmail = email.trim();
    const message = feedback.trim();

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const submittedAt = new Date(timestamp).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'full',
        timeStyle: 'short',
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
                <a href="mailto:${senderEmail}" style="color: #2563eb; text-decoration: none;">${senderEmail}</a>
              </td>
            </tr>
          </table>

          <div style="background: #f0f7ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 18px 20px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="margin-top: 28px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            Feedback ID: ${feedbackId} &nbsp;·&nbsp; Delaney's World &nbsp;·&nbsp; laneysworld.com
          </p>
        </div>
      `;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: "Delaney's World <updates@laneysworld.com>",
          to: ['updates@laneysworld.com'],
          reply_to: senderEmail,
          subject: `New message from ${displayName} — Delaney's World`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error(`Resend API error: ${resendError}`);
        return res.status(502).json({ error: 'Failed to send email. Please try again.' });
      }

      console.log(`Email sent for feedback ${feedbackId}`);
    } else {
      console.warn('RESEND_API_KEY not set — skipping email.');
    }

    return res.json({
      success: true,
      message: 'Thank you for your message!',
      feedbackId,
    });
  } catch (error) {
    console.error(`POST /feedback error:`, error);
    return res.status(500).json({ error: `Failed to submit feedback: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Laneysworld API listening on port ${PORT}`);
});
