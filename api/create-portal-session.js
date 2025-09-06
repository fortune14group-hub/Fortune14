// /api/create-portal-session.js (CommonJS)
const Stripe = require('stripe');
const { supabaseAdmin } = require('./_supabaseAdmin');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const userId = req.headers['x-sb-user'] || '';
    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !user?.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer for user' });
    }

    const returnUrl = (process.env.PUBLIC_BASE_URL || req.headers.origin) + '/app.html';
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl
    });

    return res.status(200).json({ url: portal.url });
  } catch (e) {
    console.error('create-portal-session failed', e);
    return res.status(500).json({ error: 'Stripe portal error' });
  }
};
