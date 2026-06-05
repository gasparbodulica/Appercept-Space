import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { email?: string; code?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { email, code, name } = body;
  if (!email || !code) {
    return NextResponse.json({ ok: false, error: 'Missing email or code.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Email service is not configured yet. Add RESEND_API_KEY to .env.local and restart.' },
      { status: 500 },
    );
  }

  // For production verify your own domain and use e.g. "Appercept Space <noreply@appercept.net>".
  // The onboarding sender can only deliver to the Resend account owner's email (great for testing).
  const from = process.env.RESEND_FROM || 'Appercept Space <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${code} is your Appercept Space reset code`,
        html: resetEmailHtml({ code, name: name || 'there' }),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ ok: false, error: 'The email service rejected the request.', detail }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not reach the email service.' }, { status: 502 });
  }
}

// ─── Branded reset email (inline styles for email-client compatibility) ────────
function resetEmailHtml({ code, name }: { code: string; name: string }): string {
  const spaced = code.split('').join('&nbsp;&nbsp;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#070b12;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070b12;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0b1a30;border:1px solid rgba(28,117,188,0.28);border-radius:18px;overflow:hidden;">
          <!-- Header band -->
          <tr>
            <td style="background:linear-gradient(135deg,#1c75bc 0%,#00d2ff 100%);padding:30px 32px;text-align:center;">
              <div style="display:inline-block;width:46px;height:46px;line-height:46px;border-radius:12px;background:rgba(255,255,255,0.16);color:#ffffff;font-size:22px;font-weight:800;">A</div>
              <div style="margin-top:12px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">Appercept Space</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:34px 32px 8px;">
              <h1 style="margin:0 0 10px;color:#e8f0f8;font-size:22px;font-weight:800;">Reset your password</h1>
              <p style="margin:0 0 22px;color:#9fb8d0;font-size:14px;line-height:1.6;">
                Hi ${name}, we received a request to reset your Appercept Space password. Use the code below on the reset screen. It expires in 15 minutes.
              </p>
              <!-- Code box -->
              <div style="margin:0 auto 22px;text-align:center;background:#081320;border:1px solid rgba(0,210,255,0.30);border-radius:12px;padding:22px 12px;">
                <div style="color:#5f86a8;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:8px;">Your reset code</div>
                <div style="color:#00d2ff;font-size:34px;font-weight:800;letter-spacing:0.12em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">${spaced}</div>
              </div>
              <p style="margin:0 0 6px;color:#5f86a8;font-size:12px;line-height:1.6;">
                Didn't request this? You can safely ignore this email — your password won't change.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px 28px;border-top:1px solid rgba(28,117,188,0.16);">
              <p style="margin:0;color:#3d5a78;font-size:11px;line-height:1.6;">
                Appercept · Perceive Beyond<br />
                This is an automated security email from your Appercept Space workspace.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
