import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Klienten (app.html) skickar dessa headers
    const userId = req.headers['x-sb-user'] || '';
    const email  = req.headers['x-sb-email'] || '';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.PUBLIC_BASE_URL}/app.html?upgrade=success`,
      cancel_url: `${process.env.PUBLIC_BASE_URL}/app.html?upgrade=cancel`,
      allow_promotion_codes: true,
      metadata: { user_id: userId },
      customer_email: email || undefined
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: 'Stripe error' });
  }
}
