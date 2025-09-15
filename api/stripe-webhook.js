// /api/stripe-webhook.js
export const config = { runtime: "nodejs" };

import Stripe from "stripe";
import getRawBody from "raw-body";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export function isActiveSubscription(status) {
  // De statusar där vi betraktar användaren som premium
  return ["trialing", "active", "past_due", "unpaid"].includes(status);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send("Missing Stripe signature or webhook secret");
  }

  let event;
  try {
    const body = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const user_id =
          session.metadata?.user_id || session.client_reference_id || null;

        // Länka sub-id till användaren om det finns
        let subscriptionId = session.subscription || null;

        // Säkra kund-id
        const customerId = session.customer;

        if (user_id) {
          const update = {
            stripe_customer_id: customerId,
          };
          if (subscriptionId) update.stripe_subscription_id = subscriptionId;

          const { error } = await supabaseAdmin
            .from("users")
            .update(update)
            .eq("id", user_id);
          if (error) throw error;
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status;

        // Försök hitta user via kund-id
        const { data: userRow, error: findErr } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (findErr) {
          // Om inte hittad: som fallback, försök via metadata.user_id om finns
          const user_id = sub.metadata?.user_id || null;
          if (user_id) {
            await supabaseAdmin
              .from("users")
              .upsert({
                id: user_id,
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id,
                is_premium: isActiveSubscription(status),
              }, { onConflict: "id" });
          }
        } else {
          await supabaseAdmin
            .from("users")
            .update({
              stripe_subscription_id: sub.id,
              is_premium: isActiveSubscription(status),
            })
            .eq("id", userRow.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;

        const { data: userRow } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (userRow?.id) {
          await supabaseAdmin
            .from("users")
            .update({ is_premium: false, stripe_subscription_id: null })
            .eq("id", userRow.id);
        }
        break;
      }

      default:
        // Ignorera övriga events
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    return res.status(500).send("Webhook handler error");
  }
}
