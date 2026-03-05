// pages/api/paypal/capture.js
//
// Called after the customer approves the PayPal payment and is redirected back.
// Captures the payment and confirms the order.
//
// POST body: { orderID: "PAY-xxx" }

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

  const data = await res.json();
  return { token: data.access_token, base };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: "orderID is required" });
    }

    const { token, base } = await getPayPalAccessToken();

    const captureRes = await fetch(
      `${base}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!captureRes.ok) {
      const err = await captureRes.text();
      throw new Error(`PayPal capture failed: ${err}`);
    }

    const captureData = await captureRes.json();
    const status = captureData.status; // "COMPLETED" on success

    return res.status(200).json({
      success: status === "COMPLETED",
      status,
      orderID,
      details: captureData,
    });
  } catch (err) {
    console.error("[PayPal Capture Error]", err);
    return res.status(500).json({
      error: "Failed to capture PayPal payment",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}
