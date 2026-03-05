// pages/success.js
// Handles post-payment redirect for both Stripe and PayPal.
// - Stripe: receives ?session_id=...&method=stripe
// - PayPal: receives ?token=...&PayerID=...&method=paypal
//           → auto-captures the PayPal order on mount

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [method, setMethod] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const { method: m, token, PayerID, session_id } = router.query;
    setMethod(m || "stripe");

    // PayPal: capture the payment using the token returned in the URL
    if (m === "paypal" && token) {
      fetch("/api/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: token }),
      })
        .then((r) => r.json())
        .then((data) => {
          setStatus(data.success ? "success" : "error");
        })
        .catch(() => setStatus("error"));
      return;
    }

    // Stripe: session_id confirms success (no extra server call needed)
    if (session_id || m === "stripe") {
      setStatus("success");
      return;
    }

    setStatus("success"); // fallback
  }, [router.isReady, router.query]);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="success-root">
        <div className="success-ambient" />

        {status === "loading" && (
          <div className="success-card">
            <div className="success-spinner">✦</div>
            <p className="success-sub">Confirming your payment…</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-card">
            <div className="success-mark">✦</div>
            <h1 className="success-title">Order Confirmed</h1>
            <p className="success-sub">
              {method === "paypal"
                ? "Your PayPal payment was received."
                : "Your card payment was successful."}
            </p>
            <p className="success-message">
              Thank you for shopping with Fashion House. Your order is being
              carefully prepared.
            </p>
            <Link href="/" className="success-btn">
              Continue Shopping →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="success-card">
            <div className="success-mark error">✗</div>
            <h1 className="success-title">Payment Issue</h1>
            <p className="success-sub">
              We couldn't confirm your payment. Please contact support or try
              again.
            </p>
            <Link href="/" className="success-btn">
              Return to Shop →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Montserrat:wght@300;400;500&display=swap');

.success-root {
  position: relative;
  min-height: 100vh;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  padding: 24px;
}

.success-ambient {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,169,110,0.09) 0%, transparent 70%);
}

.success-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  padding: 48px 32px;
  border: 1px solid rgba(201,169,110,0.2);
  background: rgba(255,255,255,0.02);
}

.success-mark {
  font-size: 42px;
  color: #c9a96e;
  animation: luxeGlow 2s ease-in-out infinite;
}

.success-mark.error { color: #e57373; animation: none; }

.success-spinner {
  font-size: 32px;
  color: #c9a96e;
  animation: luxeRotate 2s linear infinite;
}

@keyframes luxeRotate { to { transform: rotate(360deg); } }
@keyframes luxeGlow {
  0%,100% { opacity:1; text-shadow: none; }
  50%      { opacity:.7; text-shadow: 0 0 20px rgba(201,169,110,0.7); }
}

.success-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: 300;
  letter-spacing: 0.15em;
  color: #c9a96e;
  margin: 0;
}

.success-sub {
  font-size: 12px;
  color: #4a4540;
  letter-spacing: 0.05em;
  font-weight: 300;
  margin: 0;
}

.success-message {
  font-size: 13px;
  color: #f5f0eb;
  line-height: 1.7;
  font-weight: 300;
  margin: 0;
}

.success-btn {
  display: inline-block;
  margin-top: 8px;
  background: #c9a96e;
  color: #0a0a0a;
  border: none;
  padding: 13px 28px;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.success-btn:hover { background: #e8d5b0; }

@media (max-width: 480px) {
  .success-card { padding: 36px 20px; }
}
`;
