// api/stripe-webhook.js
import Stripe from "stripe";

export const config = {
  api: { bodyParser: false }, // behövs för att verifiera signaturen
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // läggs till i Vercel senare
    );
  } catch (err) {
    console.error("Webhook verify failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Här kommer händelser in: checkout.session.completed, customer.subscription.updated etc.
  // TODO: Koppla till Supabase och sätt users.is_premium baserat på kundens status.
  // (Vi lägger till detta när du vill.)

  return res.status(200).send("ok");
}
