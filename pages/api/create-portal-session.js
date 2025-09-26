import Stripe from 'stripe';

import { env } from '@/config/env.mjs';
import { getSupabaseServiceRoleClient } from '@/lib/supabaseAdmin';

const stripeSecretKey = env.STRIPE_SECRET_KEY;
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
    env.APP_BASE_URL,
    env.NEXT_PUBLIC_SITE_URL,
    env.STRIPE_RETURN_URL_BASE,
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

  if (env.NODE_ENV !== 'production') {
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
    res.status(405).send('Method Not Allowed');
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

    if (!userId) {
      res.status(401).json({ error: 'Ogiltig användare' });
      return;
    }

    const { data: userRow, error } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!userRow?.stripe_customer_id) {
      res.status(400).json({ error: 'No Stripe customer for this user' });
      return;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: `${baseUrl}/app`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
}
