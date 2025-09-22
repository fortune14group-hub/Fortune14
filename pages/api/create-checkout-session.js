import Stripe from 'stripe';
import { getSupabaseServiceRoleClient } from '../../lib/supabaseAdmin.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient = null;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY saknas i miljön.');
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  return stripeClient;
}

function normalizeBaseUrl(candidate) {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, '');
}

function getAppBaseUrl() {
  const candidates = [
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.STRIPE_RETURN_URL_BASE,
  ];

  if (process.env.VERCEL_URL) {
    candidates.push(`https://${process.env.VERCEL_URL}`);
  }

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }

  return null;
}

function extractAccessToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') {
    return null;
  }
  return token?.trim() || null;
}

async function getAuthenticatedUser(req, supabaseAdmin) {
  const token = extractAccessToken(req);
  if (!token) {
    return { error: { status: 401, message: 'Authorization-header saknas' } };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    console.error('Kunde inte verifiera Supabase-session:', error);
    return { error: { status: 401, message: 'Ogiltig eller utgången session' } };
  }

  return { user: data.user };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseServiceRoleClient();
    } catch (configErr) {
      console.error('Supabase-konfiguration saknas:', configErr);
      res.status(500).json({ error: 'Supabase-konfiguration saknas' });
      return;
    }

    const authResult = await getAuthenticatedUser(req, supabaseAdmin);
    if (authResult.error) {
      res.status(authResult.error.status).json({ error: authResult.error.message });
      return;
    }

    let stripe;
    try {
      stripe = getStripeClient();
    } catch (configErr) {
      console.error('Stripe-konfiguration saknas:', configErr);
      res.status(500).json({ error: 'Stripe-konfiguration saknas' });
      return;
    }

    const baseUrl = getAppBaseUrl();
    if (!baseUrl) {
      console.error('Ingen säker bas-URL är konfigurerad för Stripe-redirects.');
      res.status(500).json({ error: 'Stripe-konfiguration saknas' });
      return;
    }

    const authUser = authResult.user;
    const userId = authUser.id;
    const userEmail = typeof authUser.email === 'string' ? authUser.email.trim() : undefined;

    if (!userId) {
      res.status(401).json({ error: 'Ogiltig användare' });
      return;
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .maybeSingle();

    if (userErr) throw userErr;

    let profile = userRow || null;

    if (!profile) {
      const payload = { id: userId };
      if (userEmail) {
        payload.email = userEmail;
      }
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('users')
        .upsert(payload)
        .select('stripe_customer_id, email')
        .single();
      if (insertErr) throw insertErr;
      profile = inserted;
    } else if (userEmail && profile.email !== userEmail) {
      const { error: emailUpdateErr } = await supabaseAdmin
        .from('users')
        .update({ email: userEmail })
        .eq('id', userId);
      if (emailUpdateErr) throw emailUpdateErr;
      profile.email = userEmail;
    }

    const customerEmail = userEmail || profile?.email || undefined;

    let customerId = profile?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      const { error: upErr } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
      if (upErr) throw upErr;
    }

    if (!process.env.STRIPE_PRICE_ID) {
      console.error('STRIPE_PRICE_ID saknas i miljövariablerna.');
      res.status(500).json({ error: 'Stripe-konfiguration saknas' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${baseUrl}/app?checkout=success`,
      cancel_url: `${baseUrl}/app?checkout=cancel`,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: userId,
      metadata: { user_id: userId },
      allow_promotion_codes: true,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    res.status(500).json({ error: 'Stripe checkout error' });
  }
}
