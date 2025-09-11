// /api/stripe-webhook.js
// Vercel Edge/Node runtime för att läsa rå body korrekt
export const config = { runtime: 'nodejs18.x' };

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import getRawBody from 'raw-body';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let event;
  try {
    const raw = await getRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // När checkouten lyckas
        const session = event.data.object;
        // user_id kan komma via metadata eller client_reference_id
        const userId =
          session.metadata?.user_id || session.client_reference_id || null;

        // Hämta sub & kund
        const subscriptionId = session.subscription || null;
        let customerId = session.customer || null;

        // Sätt premium i Supabase
        if (userId) {
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              is_premium: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', userId);

          if (error) console.error('Supabase update error (premium true):', error);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const isActive =
          sub.status === 'active' || sub.status === 'trialing';

        // Map kund -> user via users-tabellen
        const { data: userRow, error: findErr } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!findErr && userRow?.id) {
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              is_premium: isActive,
              stripe_subscription_id: sub.id,
            })
            .eq('id', userRow.id);

          if (error) console.error('Supabase update error (sub state):', error);
        }
        break;
      }

      default:
        // Ignorera övriga events
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send('Server error');
  }
}
