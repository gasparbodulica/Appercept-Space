import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Stripe Connect onboarding for ClubCrowd venues.
 *
 * Real flow (once STRIPE_SECRET_KEY is set in .env.local):
 *   1. POST { action: 'create-link', venue } → creates a Connect account + onboarding link
 *   2. Venue completes Stripe onboarding, returns to the app
 *   3. POST { action: 'balance', accountId } → fetches that venue's live balance/volume
 *
 * Until a key is configured, every action returns a "not configured" notice so the
 * UI can show a clear call-to-action instead of failing silently.
 */
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (!key) {
    return NextResponse.json({
      ok: false,
      configured: false,
      error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local and restart the server.',
    }, { status: 503 });
  }

  try {
    if (action === 'create-link') {
      // 1. Create (or reuse) a Connect Express account for this venue
      const acctRes = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ type: 'express', 'business_profile[name]': body.venue ?? 'ClubCrowd venue', country: 'HR', 'capabilities[transfers][requested]': 'true' }),
      });
      const acct = await acctRes.json();
      if (!acctRes.ok) return NextResponse.json({ ok: false, error: acct.error?.message ?? 'Account creation failed' }, { status: 400 });

      const origin = req.headers.get('origin') ?? 'http://localhost:3000';
      const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ account: acct.id, refresh_url: `${origin}/pages/clubcrowd`, return_url: `${origin}/pages/clubcrowd`, type: 'account_onboarding' }),
      });
      const link = await linkRes.json();
      if (!linkRes.ok) return NextResponse.json({ ok: false, error: link.error?.message ?? 'Link creation failed' }, { status: 400 });

      return NextResponse.json({ ok: true, accountId: acct.id, url: link.url });
    }

    if (action === 'balance') {
      const accountId = body.accountId as string;
      if (!accountId) return NextResponse.json({ ok: false, error: 'No accountId provided' }, { status: 400 });
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${key}`, 'Stripe-Account': accountId },
      });
      const balance = await res.json();
      if (!res.ok) return NextResponse.json({ ok: false, error: balance.error?.message ?? 'Balance fetch failed' }, { status: 400 });
      return NextResponse.json({ ok: true, balance });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to reach Stripe API.' }, { status: 500 });
  }
}
