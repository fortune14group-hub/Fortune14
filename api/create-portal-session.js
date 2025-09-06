import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Klienten skickar användarens id i headern
    const userId = req.headers['x-sb-user'];
    if (!userId) return res.status(401).json({ error: 'No user' });

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !user?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer for this user' });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.PUBLIC_BASE_URL}/app.html`
    });

    return res.status(200).json({ url: portal.url });
  } catch (err) {
    console.error('create-portal-session error', err);
    return res.status(500).json({ error: 'Portal error' });
  }
}
