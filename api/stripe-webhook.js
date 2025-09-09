// /api/stripe-webhook.js
// Kör i Node (krav för Stripe SDK + rå body)
module.exports.config = { runtime: 'nodejs18.x' };

const Stripe = require('stripe');

// ---- Läs rå body (behövs för signaturverifiering) ----
async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    try {
      let data = [];
      req.on('data', (chunk) => data.push(chunk));
      req.on('end', () => resolve(Buffer.concat(data).toString('utf8')));
      req.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

// ---- Supabase Admin-klient ----
function getSupabaseAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceRole) {
    throw new Error('Server config error: SUPABASE_URL eller SUPABASE_SERVICE_ROLE saknas');
  }
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecret) {
    console.error('ENV MISSING: STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Server config error (stripe key)' });
  }
  if (!webhookSecret) {
    console.error('ENV MISSING: STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Server config error (webhook secret)' });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

  let event;
  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Hjälpare: uppdatera premiumflagga i Supabase
  async function setPremiumByUserId(userId, isPremium) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('users')
      .update({ is_premium: isPremium })
      .eq('id', userId);
    if (error) throw error;
  }

  async function setPremiumByEmail(email, isPremium) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('users')
      .update({ is_premium: isPremium })
      .eq('email', email);
    if (error) throw error;
  }

  try {
    switch (event.type) {
      // Betalning klar → aktivera premium
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metaUserId = session.metadata && session.metadata.user_id;
        const email = session.customer_details?.email || session.customer_email;

        if (metaUserId) {
          await setPremiumByUserId(metaUserId, true);
          console.log('Premium activated (by user_id):', metaUserId);
        } else if (email) {
          await setPremiumByEmail(email, true);
          console.log('Premium activated (by email):', email);
        } else {
          console.warn('No user reference on session; cannot set premium');
        }
        break;
      }

      // Prenumeration avslutad/annullerad → stäng av premium
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        // Försök hitta användaren via customer_email på senaste invoice/obj
        const obj = event.data.object;
        const email =
          obj.customer_email ||
          obj.customer_details?.email ||
          obj.customer?.email ||
          obj.customer_email_address; // fallback-varianter

        if (email) {
          await setPremiumByEmail(email, false);
          console.log('Premium disabled (by email):', email, 'event:', event.type);
        } else {
          console.warn('Could not resolve email for downgrade event:', event.type);
        }
        break;
      }

      default:
        // Logga men returnera 200 så Stripe inte retry:ar i onödan
        console.log('Unhandled event type:', event.type);
    }

    // Svara Stripe
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler failed:', {
      message: err.message,
      type: err.type,
      code: err.code,
      stack: err.stack
    });
    return res.status(500).json({ error: err.message });
  }
};
