import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY måste vara satt för Stripe Checkout.');
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
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const origin = getOrigin(req);
    const { user_id, email } = req.body || {};
    const incomingEmail = typeof email === 'string' ? email.trim() : undefined;

    if (!user_id) {
      res.status(400).json({ error: 'Missing user_id' });
      return;
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user_id)
      .maybeSingle();

    if (userErr) throw userErr;

    let profile = userRow || null;

    if (!profile) {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('users')
        .upsert({ id: user_id, email: incomingEmail })
        .select('stripe_customer_id, email')
        .single();
      if (insertErr) throw insertErr;
      profile = inserted;
    } else if (incomingEmail && profile.email !== incomingEmail) {
      const { error: emailUpdateErr } = await supabaseAdmin
        .from('users')
        .update({ email: incomingEmail })
        .eq('id', user_id);
      if (emailUpdateErr) throw emailUpdateErr;
      profile.email = incomingEmail;
    }

    const customerEmail = incomingEmail || profile?.email || undefined;

    let customerId = profile?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: { user_id },
      });
      customerId = customer.id;

      const { error: upErr } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id);
      if (upErr) throw upErr;
    }

    if (!process.env.STRIPE_PRICE_ID) {
      throw new Error('STRIPE_PRICE_ID saknas i miljövariablerna.');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/app?checkout=cancel`,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user_id,
      metadata: { user_id },
      allow_promotion_codes: true,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    res.status(500).json({ error: 'Stripe checkout error' });
  }
}
