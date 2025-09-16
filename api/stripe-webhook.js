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


function logSupabaseError(eventType, context, error) {
  const parts = [
    `event=${eventType}`,
    context?.userId ? `user=${context.userId}` : "user=unknown",
    context?.customerId ? `customer=${context.customerId}` : null,
    context?.subscriptionId ? `subscription=${context.subscriptionId}` : null,
  ].filter(Boolean);
  const errorMessage = error?.message || String(error);
  const message = `[Stripe webhook] Supabase error (${parts.join(", ")}, message=${errorMessage})`;
  console.error(message, error);

  const monitoring = globalThis?.monitoringService;
  if (monitoring && typeof monitoring.captureException === "function") {
    const monitoringContext = {
      eventType,
      ...(context ?? {}),
      errorMessage,
    };
    monitoring.captureException(error, monitoringContext);
  }
}

async function withSupabaseLogging(eventType, context, operation) {
  try {
    return await operation();
  } catch (error) {
    logSupabaseError(eventType, context, error);
    throw error;

function handleSupabaseError(eventType, userId, error) {
  const resolvedUserId = userId ?? "unknown";
  const errorMessage = error?.message || String(error);

  console.error(
    `Stripe webhook Supabase error - event: ${eventType}, user: ${resolvedUserId}, message: ${errorMessage}`
  );

  const monitoringService = globalThis?.monitoringService;
  if (
    monitoringService &&
    typeof monitoringService.captureException === "function"
  ) {
    monitoringService.captureException(error, {
      eventType,
      userId: userId ?? null,
      message: errorMessage,
    });
 main
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
        const userId =
          session.metadata?.user_id || session.client_reference_id || null;
        const subscriptionId = session.subscription || null;
        const customerId = session.customer;


        if (userId) {
          const context = { userId, customerId, subscriptionId };
          await withSupabaseLogging(event.type, context, async () => {
            const update = {
              stripe_customer_id: customerId,
            };
            if (subscriptionId) {
              update.stripe_subscription_id = subscriptionId;
            }

        try {
          if (user_id) {
            const update = {
              stripe_customer_id: customerId,
            };
            if (subscriptionId) update.stripe_subscription_id = subscriptionId;
 main

            const { error } = await supabaseAdmin
              .from("users")
              .update(update)

              .eq("id", userId);

              .eq("id", user_id);
 main
            if (error) throw error;

            if (subscriptionId) {
              const { error: premiumError } = await supabaseAdmin
                .from("users")
                .update({ is_premium: true })

                .eq("id", userId);
              if (premiumError) throw premiumError;
            }
          });

                .eq("id", user_id);
              if (premiumError) throw premiumError;
            }
          }
        } catch (error) {
          handleSupabaseError(event.type, user_id, error);
          throw error;
 main
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status;
        const metadataUserId = sub.metadata?.user_id || null;
 
        const context = {
          userId: metadataUserId,
          customerId,
          subscriptionId: sub.id,
        };

        await withSupabaseLogging(event.type, context, async () => {
          const { data: userRow, error: findErr } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (userRow?.id) {
            context.userId = userRow.id;
          }

          if (findErr && findErr.code !== "PGRST116") {
            throw findErr;
          }

          if (!userRow?.id && !metadataUserId) {
            console.warn(
              `Stripe webhook ${event.type} saknar användarreferens för kund ${customerId}`
            );

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
 main
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

        });

        } catch (error) {
          handleSupabaseError(event.type, logUserId, error);
          throw error;
        }
 main
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;

        const context = { customerId, subscriptionId: sub.id };

        await withSupabaseLogging(event.type, context, async () => {

        let logUserId = null;

        try {
 main
          const { data: userRow, error: selectError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (selectError) throw selectError;

          if (userRow?.id) {

            context.userId = userRow.id;

            logUserId = userRow.id;
 main

            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({ is_premium: false, stripe_subscription_id: null })
              .eq("id", userRow.id);

            if (updateError) throw updateError;

          } else {
            console.warn(
              `Stripe webhook ${event.type} hittade ingen användare för kund ${customerId}`
            );
          }
        });

          }
        } catch (error) {
          handleSupabaseError(event.type, logUserId, error);
          throw error;
        }
 main
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
