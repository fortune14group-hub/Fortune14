// /api/create-portal-session.js
export const config = { runtime: 'nodejs' };

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { user_id } = req.body || {};
    if (!user_id) {
      res.status(400).json({ error: 'Missing user_id' });
      return;
    }

    const { data: userRow, error } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!userRow?.stripe_customer_id) {
      res.status(400).json({ error: 'No Stripe customer for this user' });
      return;
    }

    const returnUrl = `${getOrigin(req)}/app.html`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (e) {
    console.error('Portal error:', e);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
}
