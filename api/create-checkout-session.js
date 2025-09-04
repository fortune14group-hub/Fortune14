// api/create-checkout-session.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      // tillbaka till appen efter betalning
      success_url: `${req.headers.origin}/app.html?upgrade=success`,
      cancel_url: `${req.headers.origin}/app.html?upgrade=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
