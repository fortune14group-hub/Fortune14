// /api/stripe-webhook.js (CommonJS)
const Stripe = require('stripe');
const { supabaseAdmin } = require('./_supabaseAdmin');
const getRawBody = require('raw-body');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Vercel (Node) – stäng av bodyParser
module.exports.config = { api: { bodyParser: false } };

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  let event;
  try {
    const buf = await getRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!relevantEvents.has(event.type)) return res.status(200).send('Ignored');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id || null;
        const customerId = session.customer;
        if (userId && customerId) {
          await supabaseAdmin
            .from('users')
            .upsert({ id: userId, stripe_customer_id: customerId, is_premium: true }, { onConflict: 'id' });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const isPremium = ['active', 'trialing', 'past_due'].includes(sub.status);
        await supabaseAdmin
          .from('users')
          .update({ is_premium: isPremium })
          .eq('stripe_customer_id', sub.customer);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabaseAdmin
          .from('users')
          .update({ is_premium: false })
          .eq('stripe_customer_id', sub.customer);
        break;
      }
    }
    return res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook handler failed:', err);
    return res.status(500).send('Webhook handler failed');
  }
};
