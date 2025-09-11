// /api/create-checkout-session.js
export const config = { runtime: 'nodejs18.x' };

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { user_id, email } = req.body || {};

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID in env' });
    }

    const origin = req.headers.origin || process.env.PUBLIC_BASE_URL || 'https://www.betspread.se';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${origin}/app.html?checkout=success`,
      cancel_url: `${origin}/app.html?checkout=cancel`,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // koppla kunden
      customer_email: email || undefined,
      client_reference_id: user_id || undefined,
      metadata: { user_id: user_id || '' },
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
