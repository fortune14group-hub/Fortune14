// /api/create-checkout-session.js (CommonJS)
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
    const email = req.headers['x-sb-email'] || '';

    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    // 1) Hämta ev. kund från Supabase
    let { data: userRow, error: uErr } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (uErr && uErr.code !== 'PGRST116') {
      console.error('supabase error', uErr);
      return res.status(500).json({ error: 'Supabase error' });
    }

    let customerId = userRow?.stripe_customer_id || null;

    // 2) Skapa Stripe-kund om det saknas
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { user_id: userId }
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('users')
        .upsert({ id: userId, stripe_customer_id: customerId }, { onConflict: 'id' });
    }

    // 3) Skapa Checkout-session (subscription)
    const base = process.env.PUBLIC_BASE_URL || req.headers.origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${base}/app.html?success=1`,
      cancel_url: `${base}/app.html?canceled=1`,
      metadata: { user_id: userId }
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session failed', e);
    return res.status(500).json({ error: 'Stripe error' });
  }
};
