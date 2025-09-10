// /api/stripe-webhook.js
// Node-runtime + rå body (krävs för att verifiera Stripe-signatur)
module.exports.config = { runtime: 'nodejs18.x' };

const getRawBody = require('raw-body');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Supabase admin-klient (service role)
function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceRole) {
    throw new Error('SUPABASE_URL eller SUPABASE_SERVICE_ROLE saknas');
  }
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (e) {
    console.error('raw-body error:', e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('ENV MISSING: STRIPE_WEBHOOK_SECRET');
    return res.status(500).send('Server config error');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook signature error: ${err.message}`);
  }

  // Hantera event
  try {
    const sb = supabaseAdmin();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Vi kör prenumerationer – hämta nycklar
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          null;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || null;
        const customerId = session.customer || null;

        // Om du la user_id i metadata när du skapade session: session.metadata?.user_id
        const userId = session.metadata?.user_id || null;

        // Markera premium i Supabase (via user_id om vi har det, annars via email)
        if (userId) {
          await sb
            .from('users')
            .update({
              is_premium: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } else if (email) {
          await sb
            .from('users')
            .update({
              is_premium: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('email', email);
        } else {
          console.warn('checkout.session.completed utan email/user_id');
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        // vid deleted eller status=canceled → förlorar premium
        const sub = event.data.object;
        if (event.type === 'customer.subscription.deleted' || sub.status === 'canceled') {
          const customerId = sub.customer;

          // Nollställ premium baserat på kund-id
          await sb
            .from('users')
            .update({
              is_premium: false,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        // Ignorera andra events
        break;
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Internal webhook error');
  }
};
