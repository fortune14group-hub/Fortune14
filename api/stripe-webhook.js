// api/stripe-webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from './_supabaseAdmin.js';

export const config = {
  api: { bodyParser: false } // krävs för att kunna verifiera Stripe-signaturen
};

// Vi kan börja med bara checkout.session.completed.
// (Du kan aktivera fler events i Stripe senare – koden nedan hanterar dem också.)
const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!relevantEvents.has(event.type)) {
    return res.status(200).send('Ignored');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // När kunden betalat klart (subscription-mode)
        const session = event.data.object;
        const userId = session.metadata?.user_id || null; // skickas från create-checkout-session
        const customerId = session.customer;

        if (userId && customerId) {
          // Spara kund-id + markera premium
          await supabaseAdmin
            .from('users')
            .update({ stripe_customer_id: customerId, is_premium: true })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Håll premium-status i synk (om du lägger till dessa events i Stripe)
        const sub = event.data.object;
        const isPremium = ['active', 'trialing'].includes(sub.status);
        await supabaseAdmin
          .from('users')
          .update({ is_premium: isPremium })
          .eq('stripe_customer_id', sub.customer);
        break;
      }

      case 'customer.subscription.deleted': {
        // Nedgradera om abonnemanget avslutas
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
    console.error('❌ Webhook handler failed:', err);
    return res.status(500).send('Webhook handler failed');
  }
}
