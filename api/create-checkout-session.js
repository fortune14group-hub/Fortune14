// api/create-checkout-session.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // från dina env vars
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/app.html?success=true`,
      cancel_url: `${req.headers.origin}/app.html?canceled=true`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
};
