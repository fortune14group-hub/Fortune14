// /api/create-checkout-session.js
export const config = { runtime: "nodejs" };

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

function getOrigin(req) {
  // Använd värd från request för att bygga absolut URL till app.html
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const origin = getOrigin(req);
    const { user_id, email } = req.body || {};

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    // Hämta ev. befintlig stripe_customer_id för användaren
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", user_id)
      .single();

    if (userErr) throw userErr;

    const customerEmail = email || userRow?.email || undefined;

    // Skapa kund i Stripe om saknas
    let customerId = userRow?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: { user_id },
      });
      customerId = customer.id;

      const { error: upErr } = await supabaseAdmin
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user_id);
      if (upErr) throw upErr;
    }

    // Skapa Checkout-session (SUBSCRIPTION)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      success_url: `${origin}/app.html?checkout=success`,
      cancel_url: `${origin}/app.html?checkout=cancel`,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user_id,     // fallback
      metadata: { user_id },            // webhook läser denna
      allow_promotion_codes: true
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: "Stripe checkout error" });
  }
}
