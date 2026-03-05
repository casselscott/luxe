// pages/api/checkout.js
//
// Unified payment endpoint — supports both Stripe and PayPal.
// Called by ChatbotWidget when the customer clicks a payment button.
//
// POST body:
//   { items: [...], method: "stripe" | "paypal" }
//
// Returns:
//   Stripe  → { url: "https://checkout.stripe.com/..." }
//   PayPal  → { orderID: "PAY-xxx", approvalUrl: "https://paypal.com/..." }

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── PayPal: get access token ─────────────────────────────────────────────────
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const base =
    process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return { token: data.access_token, base };
}

// ─── PayPal: create order ─────────────────────────────────────────────────────
async function createPayPalOrder(items) {
  const { token, base } = await getPayPalAccessToken();

  // Build PayPal line items
  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.price) * (item.qty || 1),
    0,
  );

  const paypalItems = items.map((item) => ({
    name: item.name,
    unit_amount: {
      currency_code: "USD",
      value: Number(item.price).toFixed(2),
    },
    quantity: String(item.qty || 1),
  }));

  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: itemsTotal.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: itemsTotal.toFixed(2),
            },
          },
        },
        items: paypalItems,
        description: "Fashion House — LUXE Chatbot Purchase",
      },
    ],
    application_context: {
      brand_name: "Fashion House",
      landing_page: "NO_PREFERENCE",
      shipping_preference: "GET_FROM_FILE",
      user_action: "PAY_NOW",
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?method=paypal`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    },
  };

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal order creation failed: ${err}`);
  }

  const order = await res.json();

  // Extract the approval URL (where we redirect the customer)
  const approvalUrl = order.links?.find((l) => l.rel === "approve")?.href;

  return { orderID: order.id, approvalUrl };
}

// ─── Stripe: create checkout session ─────────────────────────────────────────
async function createStripeSession(items) {
  const lineItems = items.map((item) => {
    const productData = { name: item.name };
    if (item.imageUrl?.startsWith("https")) {
      productData.images = [item.imageUrl];
    }
    return {
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(item.price) * 100),
        product_data: productData,
      },
      quantity: item.qty || 1,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&method=stripe`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "NG", "ZA", "AE", "GH", "KE"],
    },
    allow_promotion_codes: true,
    metadata: { source: "luxe_chatbot" },
  });

  return { url: session.url };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, method = "stripe" } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (method === "paypal") {
      const result = await createPayPalOrder(items);
      return res.status(200).json(result);
    }

    // Default: Stripe
    const result = await createStripeSession(items);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[Checkout Error]", err);
    return res.status(500).json({
      error: "Failed to create checkout session",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}
