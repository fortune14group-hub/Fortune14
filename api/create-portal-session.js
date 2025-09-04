// api/create-portal-session.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    // TODO: När du lagrar stripe_customer_id i Supabase kan du skapa en riktig portal-session.
    // Tills vidare skickar vi till Stripes universella portal-inlogg:
    return res.status(200).json({ url: "https://billing.stripe.com/p/login" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
