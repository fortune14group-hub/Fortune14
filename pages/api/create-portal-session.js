import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY måste vara satt för Stripe kundportal.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: `${getOrigin(req)}/app`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
}
