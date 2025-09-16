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

function handleSupabaseError(eventType, userId, error) {
  const resolvedUserId = userId ?? "unknown";
  const errorMessage = error?.message || String(error);

  const contextMessage = `Stripe webhook Supabase error - event: ${eventType}, user: ${resolvedUserId}`;
  console.error(contextMessage, error);

  const monitoringService = globalThis?.monitoringService;
  if (
    monitoringService &&
    typeof monitoringService.captureException === "function"
  ) {
    monitoringService.captureException(error, {
      eventType,
      userId: userId ?? null,
      message: errorMessage,
      context: contextMessage,
    });
  }
}

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

        try {
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

            if (subscriptionId) {
              const { error: premiumError } = await supabaseAdmin
                .from("users")
                .update({ is_premium: true })
                .eq("id", user_id);
              if (premiumError) throw premiumError;
            }
          }
        } catch (error) {
          handleSupabaseError(event.type, user_id, error);
          throw error;
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status;
        const metadataUserId = sub.metadata?.user_id || null;
        let logUserId = metadataUserId;

        try {
          // Försök hitta user via kund-id
          const { data: userRow, error: findErr } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (userRow?.id) {
            logUserId = userRow.id;
          }

          if (findErr && findErr.code !== "PGRST116") {
            throw findErr;
          }

          if (!userRow?.id && !metadataUserId) {
            console.warn(
              `Stripe webhook ${event.type} saknar användarreferens för kund ${customerId}`
            );
          }

          if (!findErr && userRow?.id) {
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({
                stripe_subscription_id: sub.id,
                is_premium: isActiveSubscription(status),
              })
              .eq("id", userRow.id);

            if (updateError) throw updateError;
          } else if (metadataUserId) {
            const { error: upsertError } = await supabaseAdmin
              .from("users")
              .upsert(
                {
                  id: metadataUserId,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: sub.id,
                  is_premium: isActiveSubscription(status),
                },
                { onConflict: "id" }
              );

            if (upsertError) throw upsertError;
          }
        } catch (error) {
          handleSupabaseError(event.type, logUserId, error);
          throw error;
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;
        let logUserId = null;

        try {
          const { data: userRow, error: selectError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (selectError) throw selectError;

          if (userRow?.id) {
            logUserId = userRow.id;

            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({ is_premium: false, stripe_subscription_id: null })
              .eq("id", userRow.id);

            if (updateError) throw updateError;
          }
        } catch (error) {
          handleSupabaseError(event.type, logUserId, error);
          throw error;
        }
        break;
      }

      default:
        console.warn("Ohanterad Stripe-webhook-händelse", event.type);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    return res.status(500).send("Webhook handler error");
  }
}
