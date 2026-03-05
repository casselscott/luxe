// components/ChatbotWidget.jsx
// ✅ FIXED: Proper error handling surface
// ✅ NEW: Multimodal image upload — drag & drop or click
// ✅ NEW: Image preview before sending
// ✅ NEW: Sends base64 image + text to /api/chatbot
// ✅ NEW: Image messages render in chat history
// ✅ NEW: Langfuse session tracking — groups all messages per user session
// Fully device-responsive floating chatbot widget

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Langfuse session ID ──────────────────────────────────────────────────────
// Generated once per browser session — groups all LUXE messages in Langfuse
// so you can see a full conversation trace in one place.
function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("luxe_session_id");
  if (!id) {
    id = `luxe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("luxe_session_id", id);
  }
  return id;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="luxe-typing" aria-label="LUXE is typing">
      <span />
      <span />
      <span />
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const [active, setActive] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const imgSrc = product.imageBase64
    ? `data:${product.imageContentType || "image/jpeg"};base64,${product.imageBase64}`
    : product.imageUrl;

  const handlers = isTouch
    ? { onClick: () => setActive((v) => !v) }
    : {
        onMouseEnter: () => setActive(true),
        onMouseLeave: () => setActive(false),
      };

  return (
    <div
      className={`luxe-product-card${active ? " active" : ""}`}
      {...handlers}
    >
      <div className="luxe-product-img-wrap">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="luxe-product-img"
            loading="lazy"
          />
        ) : (
          <div className="luxe-product-placeholder">✦</div>
        )}
        <div className="luxe-product-overlay">
          <button
            className="luxe-quick-add"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            + Add to Bag
          </button>
        </div>
      </div>
      <div className="luxe-product-info">
        <p className="luxe-product-brand">{product.brand}</p>
        <p className="luxe-product-name">{product.name}</p>
        <p className="luxe-product-price">
          ${Number(product.price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ─── Mini Checkout — 4 steps inside the panel ────────────────────────────────
// Step 0: Bag  |  Step 1: Shipping  |  Step 2: Payment  |  Step 3: Confirmed

// ─── PayPal Overlay ───────────────────────────────────────────────────────────
function PayPalOverlay({ cart, shipping, onSuccess, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => {
    const clientId =
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PAYPAL_CLIENT_ID missing from .env");
      return;
    }
    if (window.paypal) {
      setLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    s.async = true;
    s.onload = () => setLoaded(true);
    s.onerror = () => setError("Could not load PayPal. Check your connection.");
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!loaded || !ref.current || error) return;
    ref.current.innerHTML = "";
    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 44,
        },
        createOrder: (_, actions) =>
          actions.order.create({
            purchase_units: [
              {
                description: "LUXE Fashion House",
                amount: {
                  currency_code: "USD",
                  value: total.toFixed(2),
                  breakdown: {
                    item_total: {
                      currency_code: "USD",
                      value: total.toFixed(2),
                    },
                  },
                },
                items: cart.map((p) => ({
                  name: p.name.substring(0, 127),
                  unit_amount: {
                    currency_code: "USD",
                    value: Number(p.price).toFixed(2),
                  },
                  quantity: String(p.qty || 1),
                  category: "PHYSICAL_GOODS",
                })),
                shipping: shipping
                  ? {
                      name: { full_name: shipping.name },
                      address: {
                        address_line_1: shipping.address,
                        admin_area_2: shipping.city,
                        postal_code: shipping.zip,
                        country_code: shipping.country,
                      },
                    }
                  : undefined,
              },
            ],
          }),
        onApprove: async (data, actions) => {
          try {
            // 1. Capture the PayPal payment
            const capture = await actions.order.capture();
            const paypalTxn =
              capture.purchase_units?.[0]?.payments?.captures?.[0];

            // 2. Build order payload matching your Order model shape
            const orderPayload = {
              orderItems: cart.map((item) => ({
                name: item.name,
                quantity: item.qty || 1,
                image: item.imageUrl || item.image || "",
                price: Number(item.price),
                slug: item.slug || "",
                _id: item._id,
              })),
              shippingAddress: {
                fullName: shipping.name,
                address: shipping.address,
                city: shipping.city,
                postalCode: shipping.zip,
                country: shipping.country,
              },
              paymentMethod: "PayPal",
              itemsPrice: total,
              shippingPrice: 0,
              taxPrice: 0,
              totalPrice: total,
              isPaid: false, // will mark paid in step 3
              isDelivered: false,
            };

            // 3. Create the order in MongoDB (JWT cookie sent automatically)
            const createRes = await fetch("/api/orders", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(orderPayload),
            });

            if (!createRes.ok) {
              console.warn("[LUXE] Order save failed:", await createRes.text());
              onSuccess({ paypalId: paypalTxn?.id, saved: false });
              return;
            }

            const savedOrder = await createRes.json();

            // 4. Mark the order as paid using /api/orders/[id]/pay
            await fetch(`/api/orders/${savedOrder._id}/pay`, {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: paypalTxn?.id || capture.id,
                status: paypalTxn?.status || capture.status,
                email_address: capture.payer?.email_address || shipping.email,
              }),
            });

            onSuccess({
              orderId: savedOrder._id,
              paypalId: paypalTxn?.id,
              saved: true,
            });
          } catch (err) {
            console.error("[LUXE PayPal]", err);
            setError(
              "Payment captured but order save failed. Please contact support.",
            );
          }
        },
        onError: (e) => {
          console.error(e);
          setError("Payment failed — please try again.");
        },
        onCancel: () => setError("Payment cancelled."),
      })
      .render(ref.current)
      .catch((e) => setError(e.message));
  }, [loaded, error]);

  return (
    <div
      className="luxe-paypal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="luxe-paypal-sheet">
        <button
          className="luxe-paypal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="luxe-paypal-header">
          <span className="luxe-paypal-mark">✦</span>
          <p className="luxe-paypal-title">Complete Payment</p>
        </div>
        <div className="luxe-paypal-order">
          {cart.map((item, i) => (
            <div key={i} className="luxe-paypal-row">
              <span>
                {item.name}
                {item.qty > 1 ? ` ×${item.qty}` : ""}
              </span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="luxe-paypal-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        {shipping && (
          <p className="luxe-paypal-ship-to">
            Delivering to <strong>{shipping.name}</strong> · {shipping.city}
          </p>
        )}
        {error ? (
          <div className="luxe-paypal-error">{error}</div>
        ) : !loaded ? (
          <div className="luxe-paypal-loading">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        <div ref={ref} />
        <p className="luxe-paypal-secure">🔒 Secured by PayPal</p>
      </div>
    </div>
  );
}

// ─── Order Confirmed Overlay ──────────────────────────────────────────────────
function ConfirmedOverlay({ cart, shipping, orderResult, onClose }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const savedToAccount = orderResult?.saved === true;
  const orderId = orderResult?.orderId;
  const fallbackRef = orderResult?.paypalId
    ? orderResult.paypalId.substring(0, 12).toUpperCase()
    : Math.random().toString(36).substr(2, 8).toUpperCase();

  return (
    <div className="luxe-paypal-overlay">
      <div className="luxe-confirmed-sheet">
        <div className="luxe-confirmed-check">✓</div>
        <p className="luxe-confirmed-title">Order Confirmed</p>
        <p className="luxe-confirmed-sub">
          Thank you{shipping?.name ? `, ${shipping.name.split(" ")[0]}` : ""}.
          Your order is on its way.
        </p>

        <div className="luxe-confirmed-ref">
          <span className="luxe-ref-label">
            {savedToAccount ? "Order ID" : "PayPal Reference"}
          </span>
          <span className="luxe-ref-val">
            {savedToAccount ? orderId.substring(0, 16) + "…" : fallbackRef}
          </span>
        </div>

        {savedToAccount ? (
          <p className="luxe-confirmed-account-notice">
            ✦ Saved to your order history
          </p>
        ) : (
          <p className="luxe-confirmed-account-notice warn">
            Sign in to track your order history
          </p>
        )}

        <div className="luxe-confirmed-items">
          {cart.map((item, i) => (
            <div key={i} className="luxe-confirmed-row">
              <span>
                {item.name}
                {item.qty > 1 ? ` ×${item.qty}` : ""}
              </span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="luxe-confirmed-total">
            <span>Total Paid</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="luxe-confirmed-btns">
          {savedToAccount && orderId && (
            <a
              href={`/order/${orderId}`}
              className="luxe-co-action-btn luxe-co-action-outline"
            >
              View Order →
            </a>
          )}
          <button className="luxe-co-action-btn" onClick={onClose}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Panel (Bag view only) ───────────────────────────────────────────────
function CartPanel({ cart, onClose, onRemoveItem, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div className="luxe-cart-panel" role="dialog" aria-label="Shopping bag">
      <div className="luxe-cart-header">
        <span className="luxe-cart-title">Your Bag</span>
        <button className="luxe-icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {cart.length === 0 ? (
        <p className="luxe-cart-empty">Your bag is empty, Fashion Lover.</p>
      ) : (
        <>
          <div className="luxe-cart-items">
            {cart.map((item, i) => (
              <div key={i} className="luxe-cart-item">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="luxe-cart-item-img"
                  />
                )}
                <div className="luxe-cart-item-info">
                  <p className="luxe-cart-item-name">{item.name}</p>
                  <p className="luxe-cart-item-brand">{item.brand}</p>
                  <p className="luxe-cart-item-qty-label">Qty: {item.qty}</p>
                </div>
                <div className="luxe-cart-item-right">
                  <span className="luxe-cart-item-price">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                  <button
                    className="luxe-remove-item"
                    onClick={() => onRemoveItem(item._id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="luxe-cart-footer">
            <div className="luxe-cart-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="luxe-co-action-btn" onClick={onCheckout}>
              Checkout with LUXE →
            </button>
            <p className="luxe-cart-note">
              LUXE will guide you through the rest
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Review Card — shown in chat before PayPal ───────────────────────────────
function ReviewCard({ cart, shipping, onEdit, onPay }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="luxe-review-card">
      <div className="luxe-review-header">
        <span className="luxe-review-icon">✦</span>
        <span className="luxe-review-title">Order Review</span>
        <span className="luxe-review-count">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="luxe-review-shipping">
        <p className="luxe-review-section-label">Delivering to</p>
        <p className="luxe-review-ship-name">{shipping.name}</p>
        <p className="luxe-review-ship-addr">
          {shipping.address}, {shipping.city} {shipping.zip}
        </p>
        <p className="luxe-review-ship-addr">
          {shipping.country} · {shipping.email}
        </p>
      </div>

      <div className="luxe-review-items">
        <p className="luxe-review-section-label">Items</p>
        <div className="luxe-review-items-scroll">
          {cart.map((item, i) => (
            <div key={i} className="luxe-review-item">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="luxe-review-item-img"
                />
              )}
              <div className="luxe-review-item-info">
                <p className="luxe-review-item-name">{item.name}</p>
                <p className="luxe-review-item-brand">{item.brand}</p>
                {item.qty > 1 && (
                  <p className="luxe-review-item-qty">×{item.qty}</p>
                )}
              </div>
              <span className="luxe-review-item-price">
                ${(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="luxe-review-total">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="luxe-review-actions">
        <button className="luxe-review-edit-btn" onClick={onEdit}>
          ✎ Edit details
        </button>
        <button className="luxe-review-pay-btn" onClick={onPay}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#003087"
            style={{ flexShrink: 0 }}
          >
            <path d="M20.067 8.478c.492.315.844.825.983 1.39.292 1.177-.208 2.443-1.285 3.195-.577.402-1.31.63-2.11.63h-.84c-.336 0-.62.238-.676.57l-.054.3-.535 3.394-.038.218c-.056.332-.34.57-.676.57H12.87a.285.285 0 0 1-.281-.327l.515-3.265.088-.558a.685.685 0 0 1 .676-.57h.42c2.71 0 4.83-1.1 5.453-4.285.108-.55.108-1.02.025-1.462a3.3 3.3 0 0 0-.699-.6zm-1.802-.7c-.218-.062-.45-.11-.694-.14a8.2 8.2 0 0 0-1.03-.063H13.03a.685.685 0 0 0-.676.57L11.2 14.46l-.065.413a.285.285 0 0 0 .281.327h2.006c.336 0 .62-.238.676-.57l.054-.302.535-3.393.038-.217a.685.685 0 0 1 .676-.57h.42c2.71 0 4.83-1.1 5.453-4.286.26-1.325-.01-2.43-.809-3.144z" />
          </svg>
          Pay with PayPal
        </button>
      </div>
    </div>
  );
}

function ChatMessage({ msg, onAddToCart }) {
  const isUser = msg.role === "user";
  return (
    <div className={`luxe-msg-row${isUser ? " user" : ""}`}>
      {!isUser && (
        <div className="luxe-avatar" aria-hidden="true">
          ✦
        </div>
      )}
      <div className="luxe-bubble-wrap">
        <div className={`luxe-bubble${isUser ? " user" : ""}`}>
          {msg.imagePreview && (
            <div className="luxe-msg-image-wrap">
              <img
                src={msg.imagePreview}
                alt="Uploaded style"
                className="luxe-msg-image"
              />
            </div>
          )}
          {msg.text && (
            <p
              style={{ whiteSpace: "pre-line" }}
              dangerouslySetInnerHTML={{
                __html: msg.text
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>"),
              }}
            />
          )}
          {msg.products && msg.products.length > 0 && (
            <div className="luxe-products-grid">
              {msg.products.map((p, i) => (
                <ProductCard key={i} product={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Speech-to-Text Button ────────────────────────────────────────────────────
function SpeechButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggle = () => {
    if (!isSupported) return;

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recogRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!isSupported) return null;

  return (
    <button
      className={`luxe-mic-btn${listening ? " listening" : ""}`}
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Stop listening" : "Speak your style request"}
      title={listening ? "Listening… click to stop" : "Voice input"}
      type="button"
    >
      {listening ? (
        <span className="luxe-mic-wave">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      )}
    </button>
  );
}

// ─── Image Upload Button ──────────────────────────────────────────────────────
function ImageUploadButton({ onImageSelect, disabled }) {
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
      onImageSelect({ base64, mimeType, preview: dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleChange}
        aria-hidden="true"
      />
      <button
        className="luxe-upload-btn"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        aria-label="Upload style image"
        title="Upload a style image"
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </button>
    </>
  );
}

// ─── Image Preview Pill ───────────────────────────────────────────────────────
function ImagePreviewPill({ preview, name, onRemove }) {
  return (
    <div className="luxe-image-preview-pill">
      <img src={preview} alt={name} className="luxe-preview-thumb" />
      <span className="luxe-preview-name">{name}</span>
      <button
        className="luxe-preview-remove"
        onClick={onRemove}
        aria-label="Remove image"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey, welcome to Fashion House 🖤 I'm LUXE — your personal stylist. Tell me the occasion, the vibe, or just say \"surprise me\" and I'll pull the perfect look. What are we dressing for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Langfuse: stable session ID for this browser session ─────────────────
  // Initialised once on mount; passed as x-luxe-session header on every
  // fetch so the API can attach it to the Langfuse trace and group all
  // messages from this tab into a single conversation.
  const sessionIdRef = useRef(null);
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Conversational checkout state
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [shipping, setShipping] = useState({});
  const [showPayPal, setShowPayPal] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open)
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
  }, [messages, loading, open]);

  useEffect(() => {
    if (isMobile) document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (open && !isMobile) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open, isMobile]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (cartOpen) setCartOpen(false);
      else if (open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cartOpen]);

  // ── Drag & Drop on the panel ───────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
      setPendingImage({ base64, mimeType, preview: dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
  }, []);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing)
        return prev.map((i) =>
          i._id === product._id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  }, []);

  // ── Conversational checkout questions ─────────────────────────────────────
  const CHECKOUT_QUESTIONS = [
    { key: "name", q: "What's your full name for delivery?" },
    {
      key: "email",
      q: "And your email address? (We'll send your confirmation here)",
    },
    { key: "address", q: "Great! What's your delivery street address?" },
    { key: "city", q: "Which city?" },
    { key: "zip", q: "ZIP or postcode?" },
    { key: "country", q: "Last one — which country? (e.g. US, GB, NG, CA)" },
  ];

  const startCheckout = useCallback(() => {
    setCartOpen(false);
    setCheckoutMode(true);
    setCheckoutStep(0);
    setShipping({});
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text:
          "Perfect! Let's get your order on its way. I'll just need a few quick details. ✦\n\n" +
          CHECKOUT_QUESTIONS[0].q,
        isCheckout: true,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCheckoutAnswer = useCallback(
    (answer) => {
      const step = checkoutStep;
      const key = CHECKOUT_QUESTIONS[step].key;
      const newShipping = { ...shipping, [key]: answer.trim() };
      setShipping(newShipping);

      const next = step + 1;
      if (next < CHECKOUT_QUESTIONS.length) {
        setCheckoutStep(next);
        setMessages((prev) => [
          ...prev,
          { role: "user", text: answer },
          {
            role: "assistant",
            text: CHECKOUT_QUESTIONS[next].q,
            isCheckout: true,
          },
        ]);
      } else {
        setCheckoutMode(false);
        const snapCart = [...cart];
        const snapShipping = { ...newShipping };
        setMessages((prev) => [
          ...prev,
          { role: "user", text: answer },
          {
            role: "assistant",
            text: "Almost there! Here's your order review — please check everything looks right before paying. ✦",
            isCheckout: true,
            showReviewCard: true,
            reviewCart: snapCart,
            reviewShipping: snapShipping,
          },
        ]);
      }
      setInput("");
    },
    [checkoutStep, shipping, cart],
  );

  const sendMessage = useCallback(
    async (text) => {
      const msg = text || input;
      if ((!msg.trim() && !pendingImage) || loading) return;

      // ── Intercept: checkout conversation mode ──────────────────────────────
      if (checkoutMode && msg.trim()) {
        handleCheckoutAnswer(msg.trim());
        return;
      }

      const imageToSend = pendingImage;
      setInput("");
      setPendingImage(null);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text:
            msg.trim() || (imageToSend ? "Find me something like this." : ""),
          imagePreview: imageToSend?.preview || null,
        },
      ]);
      setLoading(true);

      try {
        const body = {
          message:
            msg.trim() ||
            (imageToSend
              ? "Analyze this style image and find matching products."
              : ""),
          history: messages,
          cart,
          ...(imageToSend
            ? {
                imageBase64: imageToSend.base64,
                imageMimeType: imageToSend.mimeType,
              }
            : {}),
        };

        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // ── Langfuse: pass session ID so all messages in this tab
            //    are grouped into a single conversation trace ──────────
            "x-luxe-session": sessionIdRef.current || "unknown",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.reply,
            products: data.products || [],
          },
        ]);

        if (data.checkoutUrl && typeof window !== "undefined") {
          window.location.href = data.checkoutUrl;
        }
      } catch (err) {
        console.error("[LUXE Widget]", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Something went wrong — ${err.message || "please try again"}.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      input,
      loading,
      messages,
      cart,
      pendingImage,
      checkoutMode,
      handleCheckoutAnswer,
    ],
  );

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i._id !== productId));
  }, []);

  const [orderResult, setOrderResult] = useState(null);

  const handlePayPalSuccess = useCallback((result = {}) => {
    setShowPayPal(false);
    setOrderResult(result);
    setShowConfirmed(true);
    setCart([]);
  }, []);

  const toggleOpen = () => {
    setOpen((v) => !v);
    setPulse(false);
  };
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const CATEGORY_CARDS = [
    {
      label: "The Edit",
      subtitle: "Co-ords & sets",
      message:
        "Style me in a co-ord set or matching two-piece — something fresh and put-together",
      img: "https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=300&q=80&fit=crop",
    },
    {
      label: "After Dark",
      subtitle: "Evening & gowns",
      message:
        "I need something for an evening event — show me your most stunning gowns and evening looks",
      img: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=300&q=80&fit=crop",
    },
    {
      label: "Outerwear",
      subtitle: "Jackets & layers",
      message:
        "Find me the perfect jacket — something that elevates any outfit",
      img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80&fit=crop",
    },
    {
      label: "The Step",
      subtitle: "Shoes & heels",
      message: "Show me shoes that make a statement — heels, boots or sandals",
      img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&q=80&fit=crop",
    },
    {
      label: "Effortless",
      subtitle: "Tops & blouses",
      message:
        "I want a top that looks elevated without trying too hard — blouses or structured tops",
      img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300&q=80&fit=crop",
    },
    {
      label: "Tailored",
      subtitle: "Trousers & pants",
      message:
        "Find me tailored trousers or wide-leg pants — polished and modern",
      img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&q=80&fit=crop",
    },
  ];

  const canSend =
    !loading && (input.trim().length > 0 || pendingImage !== null);

  return (
    <>
      <style>{WIDGET_CSS}</style>

      {open && isMobile && (
        <div
          className="luxe-backdrop"
          onClick={toggleOpen}
          aria-hidden="true"
        />
      )}

      <button
        className={`luxe-launcher${pulse ? " pulse" : ""}${open ? " open" : ""}`}
        onClick={toggleOpen}
        aria-label={
          open ? "Close style assistant" : "Open LUXE style assistant"
        }
        aria-expanded={open}
      >
        {open ? (
          <span className="luxe-launcher-x">✕</span>
        ) : (
          <>
            <span className="luxe-launcher-icon" aria-hidden="true">
              ✦
            </span>
            <span className="luxe-launcher-label">LUXE</span>
            {cartCount > 0 && (
              <span
                className="luxe-launcher-badge"
                aria-label={`${cartCount} items`}
              >
                {cartCount}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div
          className={`luxe-panel${dragOver ? " drag-over" : ""}`}
          role="dialog"
          aria-label="LUXE Style Assistant"
          aria-modal="true"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="luxe-ambient" aria-hidden="true" />

          {dragOver && (
            <div className="luxe-drop-overlay" aria-hidden="true">
              <div className="luxe-drop-inner">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c9a96e"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p>Drop your style image</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="luxe-header">
            <div className="luxe-header-left">
              <span className="luxe-header-mark" aria-hidden="true">
                ✦
              </span>
              <div>
                <p className="luxe-header-name">LUXE</p>
                <p className="luxe-header-sub">Style Intelligence</p>
              </div>
            </div>
            <div className="luxe-header-actions">
              <button
                className="luxe-icon-btn"
                onClick={() => setCartOpen((v) => !v)}
                aria-label={`View bag${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              >
                <span aria-hidden="true">◻</span>
                {cartCount > 0 && (
                  <span className="luxe-bag-badge" aria-hidden="true">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                className="luxe-icon-btn luxe-close-panel-btn"
                onClick={toggleOpen}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="luxe-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((msg, i) => (
              <div key={i}>
                <ChatMessage msg={msg} onAddToCart={addToCart} />
                {msg.showReviewCard && (
                  <ReviewCard
                    cart={msg.reviewCart}
                    shipping={msg.reviewShipping}
                    onEdit={() => startCheckout()}
                    onPay={() => setShowPayPal(true)}
                  />
                )}
              </div>
            ))}
            {loading && (
              <div className="luxe-msg-row">
                <div className="luxe-avatar" aria-hidden="true">
                  ✦
                </div>
                <TypingIndicator />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Curated Collections — infinite rolling marquee */}
          <div className="luxe-cats-wrap">
            <p className="luxe-cats-label">Curated Collections</p>
            <div className="luxe-marquee-outer">
              <div className="luxe-marquee-track">
                {[...CATEGORY_CARDS, ...CATEGORY_CARDS].map((cat, i) => (
                  <button
                    key={`${cat.label}-${i}`}
                    className="luxe-cat-card"
                    onClick={() => sendMessage(cat.message)}
                    aria-label={`Browse ${cat.label}`}
                  >
                    <div className="luxe-cat-img-wrap">
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className="luxe-cat-img"
                        loading="lazy"
                      />
                      <div className="luxe-cat-gradient" />
                      <p className="luxe-cat-sub-overlay">{cat.subtitle}</p>
                      <p className="luxe-cat-name-overlay">{cat.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {pendingImage && (
            <ImagePreviewPill
              preview={pendingImage.preview}
              name={pendingImage.name}
              onRemove={() => setPendingImage(null)}
            />
          )}

          {!checkoutMode && cart.length === 0 && (
            <div className="luxe-trust-bar">
              <button
                className="luxe-trust-btn"
                onClick={() =>
                  sendMessage("Just pick for me — trust your instincts, LUXE")
                }
                disabled={loading}
              >
                <span className="luxe-trust-icon">✦</span>
                Trust LUXE — Just pick for me
              </button>
            </div>
          )}

          {/* Input */}
          <div className="luxe-input-area">
            <ImageUploadButton
              onImageSelect={setPendingImage}
              disabled={loading}
            />
            <input
              ref={inputRef}
              className="luxe-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder={
                pendingImage
                  ? "Add a note (optional)…"
                  : checkoutMode
                    ? "Type your answer…"
                    : 'Occasion, vibe, or just say "surprise me"…'
              }
              aria-label="Message LUXE"
              autoComplete="off"
              enterKeyHint="send"
            />
            <SpeechButton
              onTranscript={(t) =>
                setInput((prev) => (prev ? prev + " " + t : t))
              }
              disabled={loading}
            />
            <button
              className="luxe-send"
              onClick={() => sendMessage()}
              disabled={!canSend}
              aria-label="Send"
            >
              →
            </button>
          </div>

          {cartOpen && (
            <CartPanel
              cart={cart}
              onClose={() => setCartOpen(false)}
              onRemoveItem={removeFromCart}
              onCheckout={startCheckout}
            />
          )}

          {showPayPal && (
            <PayPalOverlay
              cart={cart}
              shipping={shipping}
              onSuccess={handlePayPalSuccess}
              onClose={() => setShowPayPal(false)}
            />
          )}

          {showConfirmed && (
            <ConfirmedOverlay
              cart={cart}
              shipping={shipping}
              orderResult={orderResult}
              onClose={() => {
                setShowConfirmed(false);
                setShipping({});
                setOrderResult(null);
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const WIDGET_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Montserrat:wght@300;400;500&display=swap');

.luxe-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 9990;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  animation: luxeFadeIn .2s ease;
}
@keyframes luxeFadeIn { from{opacity:0} to{opacity:1} }

.luxe-launcher {
  position: fixed;
  bottom: 16px; right: 16px;
  z-index: 9999;
  display: flex; align-items: center; gap: 8px;
  background: #0a0a0a;
  border: 1px solid #c9a96e;
  color: #c9a96e;
  padding: 0 14px 0 11px;
  height: 46px; min-width: 46px;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 500;
  letter-spacing: .2em; text-transform: uppercase;
  transition: background .3s, box-shadow .3s, transform .15s;
  box-shadow: 0 4px 20px rgba(0,0,0,.55);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.luxe-launcher:hover, .luxe-launcher:focus-visible {
  background: rgba(201,169,110,.12);
  box-shadow: 0 4px 32px rgba(201,169,110,.28);
  outline: none;
}
.luxe-launcher:active { transform: scale(.96); }
.luxe-launcher.open  { background: rgba(201,169,110,.15); }
.luxe-launcher.pulse { animation: luxePulse 2s ease-in-out 2; }
@keyframes luxePulse {
  0%,100% { box-shadow: 0 4px 20px rgba(0,0,0,.55); }
  50%      { box-shadow: 0 4px 42px rgba(201,169,110,.55); }
}
.luxe-launcher-icon { font-size: 15px; animation: luxeRotate 6s linear infinite; }
@keyframes luxeRotate { to { transform: rotate(360deg); } }
.luxe-launcher-label { letter-spacing: .25em; }
.luxe-launcher-x     { font-size: 15px; }
.luxe-launcher-badge {
  position: absolute; top: -7px; right: -7px;
  background: #c9a96e; color: #0a0a0a;
  font-size: 9px; font-weight: 600;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #0a0a0a;
}

.luxe-panel {
  position: fixed; inset: 0;
  z-index: 9995;
  background: #0a0a0a;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: luxePanelIn .35s cubic-bezier(.34,1.3,.64,1);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
@keyframes luxePanelIn {
  from { opacity:0; transform: translateY(20px) scale(.97); }
  to   { opacity:1; transform: translateY(0)    scale(1); }
}
.luxe-panel.drag-over { border: 2px dashed rgba(201,169,110,.5); }

.luxe-drop-overlay {
  position: absolute; inset: 0; z-index: 30;
  background: rgba(10,10,10,.88);
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
  animation: luxeFadeIn .15s ease;
}
.luxe-drop-inner {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  color: #c9a96e;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px; letter-spacing: .15em; text-transform: uppercase; font-weight: 300;
}

.luxe-ambient {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 70% 40% at 90% 0%,  rgba(201,169,110,.07) 0%, transparent 70%),
    radial-gradient(ellipse 40% 50% at 0%  100%, rgba(201,169,110,.04) 0%, transparent 70%);
}

.luxe-header {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  padding: max(14px, env(safe-area-inset-top)) 16px 14px;
  border-bottom: 1px solid rgba(201,169,110,.15);
  flex-shrink: 0;
}
.luxe-header-left  { display: flex; align-items: center; gap: 10px; }
.luxe-header-mark  { color: #c9a96e; font-size: 17px; animation: luxeGlow 3s ease-in-out infinite; }
@keyframes luxeGlow {
  0%,100% { opacity:1; }
  50%      { opacity:.5; text-shadow: 0 0 10px rgba(201,169,110,.7); }
}
.luxe-header-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 300; letter-spacing: .3em; color: #c9a96e; margin: 0; line-height: 1;
}
.luxe-header-sub {
  font-family: 'Montserrat', sans-serif;
  font-size: 8px; letter-spacing: .2em; color: #4a4540; text-transform: uppercase; margin: 3px 0 0;
}
.luxe-header-actions { display: flex; align-items: center; gap: 7px; }

.luxe-icon-btn {
  position: relative;
  background: none; border: 1px solid rgba(201,169,110,.2);
  color: #c9a96e; width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 14px; font-family: inherit;
  transition: all .25s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation; flex-shrink: 0;
}
.luxe-icon-btn:hover, .luxe-icon-btn:focus-visible {
  border-color: #c9a96e; background: rgba(201,169,110,.1); outline: none;
}
.luxe-icon-btn:active { transform: scale(.92); }
.luxe-bag-badge {
  position: absolute; top: -5px; right: -5px;
  background: #c9a96e; color: #0a0a0a;
  font-size: 8px; font-weight: 600; width: 14px; height: 14px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.luxe-messages {
  position: relative; z-index: 1;
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 16px; display: flex; flex-direction: column; gap: 14px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin; scrollbar-color: rgba(201,169,110,.12) transparent;
  overscroll-behavior: contain;
}
.luxe-messages::-webkit-scrollbar { width: 3px; }
.luxe-messages::-webkit-scrollbar-thumb { background: rgba(201,169,110,.15); }

.luxe-msg-row {
  display: flex; gap: 8px; max-width: 100%;
  animation: luxeMsgIn .3s ease forwards;
}
@keyframes luxeMsgIn { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
.luxe-msg-row.user { flex-direction: row-reverse; }

.luxe-avatar {
  width: 26px; height: 26px; border: 1px solid #c9a96e;
  display: flex; align-items: center; justify-content: center;
  color: #c9a96e; font-size: 11px; flex-shrink: 0; margin-top: 2px;
}

.luxe-bubble-wrap { max-width: 86%; min-width: 0; }
.luxe-bubble {
  padding: 11px 14px;
  font-family: 'Montserrat', sans-serif;
  font-size: 13.5px; font-weight: 300; line-height: 1.7; letter-spacing: .02em;
  color: #f0ece6; word-break: break-word;
}
.luxe-bubble p { margin: 0; }
.luxe-bubble:not(.user) {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(201,169,110,.2); border-left: 2px solid #c9a96e;
}
.luxe-bubble.user {
  background: rgba(201,169,110,.12);
  border: 1px solid rgba(201,169,110,.3);
  text-align: right; color: #edd9a3;
}

.luxe-msg-image-wrap {
  margin-bottom: 8px; border-radius: 2px; overflow: hidden;
  border: 1px solid rgba(201,169,110,.2);
}
.luxe-msg-image {
  width: 100%; max-width: 200px; display: block;
  object-fit: cover; max-height: 180px;
}

.luxe-typing {
  display: flex; gap: 4px; padding: 12px 14px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(201,169,110,.15); border-left: 2px solid #c9a96e;
  width: fit-content;
}
.luxe-typing span {
  width: 5px; height: 5px; background: #c9a96e; border-radius: 50%;
  animation: luxeBounce 1.2s ease-in-out infinite;
}
.luxe-typing span:nth-child(2) { animation-delay: .2s; }
.luxe-typing span:nth-child(3) { animation-delay: .4s; }
@keyframes luxeBounce {
  0%,80%,100% { transform:scale(.5); opacity:.4; }
  40%          { transform:scale(1);  opacity:1; }
}

.luxe-products-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px;
}
.luxe-product-card {
  border: 1px solid rgba(201,169,110,.15);
  background: rgba(255,255,255,.02);
  overflow: hidden; cursor: pointer;
  transition: border-color .3s, transform .25s;
  -webkit-tap-highlight-color: transparent;
}
.luxe-product-card.active, .luxe-product-card:hover {
  border-color: #c9a96e; transform: translateY(-2px);
}
.luxe-product-img-wrap {
  position: relative; aspect-ratio: 3/4; background: #111; overflow: hidden;
}
.luxe-product-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(201,169,110,.2); font-size: 28px;
}
.luxe-product-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform .5s ease;
}
.luxe-product-card.active .luxe-product-img,
.luxe-product-card:hover .luxe-product-img { transform: scale(1.06); }
.luxe-product-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .3s;
}
.luxe-product-card.active .luxe-product-overlay,
.luxe-product-card:hover .luxe-product-overlay { opacity: 1; }
.luxe-quick-add {
  background: #c9a96e; color: #0a0a0a; border: none; padding: 8px 10px;
  font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 500;
  letter-spacing: .1em; text-transform: uppercase; cursor: pointer; transition: background .2s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation; white-space: nowrap;
}
.luxe-quick-add:hover { background: #e8d5b0; }
.luxe-quick-add:active { transform: scale(.95); }
.luxe-product-info { padding: 8px 10px; }
.luxe-product-brand { font-size: 9px; letter-spacing: .15em; color: #c9a96e; text-transform: uppercase; font-weight: 500; margin: 0; }
.luxe-product-name  { font-family: 'Cormorant Garamond', serif; font-size: 14px; color: #f0ece6; margin: 3px 0 2px; font-weight: 300; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.luxe-product-price { font-size: 12px; color: #c9a96e; font-weight: 400; margin: 0; letter-spacing: .04em; }

.luxe-cats-wrap {
  position: relative; z-index: 1; flex-shrink: 0;
  border-top: 1px solid rgba(201,169,110,.12);
  padding: 10px 0 12px;
  background: linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(10,10,10,.1) 100%);
  overflow: hidden;
}
.luxe-cats-label {
  font-family: "Montserrat", sans-serif; font-size: 9px; font-weight: 500;
  letter-spacing: .18em; text-transform: uppercase;
  color: rgba(201,169,110,.45); margin: 0 0 9px 16px;
}
.luxe-cats-wrap::before,
.luxe-cats-wrap::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 40px;
  z-index: 2; pointer-events: none;
}
.luxe-cats-wrap::before {
  left: 0;
  background: linear-gradient(to right, rgba(10,10,10,1) 0%, rgba(10,10,10,.6) 40%, transparent 100%);
}
.luxe-cats-wrap::after {
  right: 0;
  background: linear-gradient(to left, rgba(10,10,10,1) 0%, rgba(10,10,10,.6) 40%, transparent 100%);
}
.luxe-marquee-outer { overflow: hidden; width: 100%; }
.luxe-marquee-outer:hover .luxe-marquee-track { animation-play-state: paused; }
.luxe-marquee-track {
  display: flex; gap: 10px; padding: 0 14px;
  width: max-content;
  animation: luxeMarquee 26s linear infinite;
  will-change: transform;
}
@keyframes luxeMarquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.luxe-cat-card {
  flex-shrink: 0; width: 98px; background: none; border: none;
  padding: 0; cursor: pointer; text-align: left;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  transition: transform .3s cubic-bezier(.34,1.3,.64,1);
}
.luxe-cat-card:hover { transform: translateY(-4px) scale(1.02); }
.luxe-cat-card:active { transform: scale(.95); }
.luxe-cat-img-wrap {
  position: relative; width: 98px; height: 118px;
  overflow: hidden; border: 1px solid rgba(201,169,110,.18);
  transition: border-color .3s, box-shadow .3s;
}
.luxe-cat-card:hover .luxe-cat-img-wrap {
  border-color: rgba(201,169,110,.75);
  box-shadow: 0 6px 22px rgba(201,169,110,.18);
}
.luxe-cat-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform .7s ease;
  filter: brightness(.82) saturate(.8);
}
.luxe-cat-card:hover .luxe-cat-img {
  transform: scale(1.12);
  filter: brightness(.98) saturate(1.1);
}
.luxe-cat-img-wrap::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(201,169,110,.12) 50%, transparent 60%);
  background-size: 200% 200%;
  opacity: 0; transition: opacity .3s; pointer-events: none;
}
.luxe-cat-card:hover .luxe-cat-img-wrap::after {
  opacity: 1;
  animation: luxeCatShimmer .8s ease forwards;
}
@keyframes luxeCatShimmer {
  0%   { background-position: 200% 200%; }
  100% { background-position: -50% -50%; }
}
.luxe-cat-gradient {
  position: absolute; bottom: 0; left: 0; right: 0; height: 65%;
  background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 60%, transparent 100%);
  pointer-events: none;
}
.luxe-cat-name-overlay {
  position: absolute; bottom: 7px; left: 8px; right: 8px;
  font-family: "Cormorant Garamond", serif; font-size: 13px; font-weight: 400;
  color: #f0ece6; margin: 0; letter-spacing: .04em; line-height: 1.2;
}
.luxe-cat-sub-overlay {
  position: absolute; bottom: 20px; left: 8px;
  font-family: "Montserrat", sans-serif; font-size: 7.5px; font-weight: 300;
  color: rgba(201,169,110,.7); letter-spacing: .08em; text-transform: uppercase;
}

.luxe-image-preview-pill {
  display: flex; align-items: center; gap: 8px;
  margin: 0 12px 4px;
  background: rgba(201,169,110,.08);
  border: 1px solid rgba(201,169,110,.2);
  padding: 6px 10px 6px 6px;
  animation: luxeMsgIn .2s ease;
  flex-shrink: 0;
}
.luxe-preview-thumb {
  width: 32px; height: 32px; object-fit: cover; flex-shrink: 0;
  border: 1px solid rgba(201,169,110,.3);
}
.luxe-preview-name {
  font-family: 'Montserrat', sans-serif; font-size: 10px;
  color: #c9a96e; font-weight: 300; letter-spacing: .05em;
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.luxe-preview-remove {
  background: none; border: none; color: #4a4540; cursor: pointer;
  font-size: 11px; padding: 2px 4px; flex-shrink: 0;
  transition: color .2s; -webkit-tap-highlight-color: transparent;
}
.luxe-preview-remove:hover { color: #c9a96e; }

.luxe-input-area {
  position: relative; z-index: 1;
  display: flex;
  border-top: 1px solid rgba(201,169,110,.15); flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.luxe-mic-btn {
  width: 44px; flex-shrink: 0;
  background: rgba(255,255,255,.02); border: none; border-right: 1px solid rgba(201,169,110,.15);
  color: rgba(201,169,110,.55); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  position: relative;
}
.luxe-mic-btn:hover:not(:disabled) { background: rgba(201,169,110,.08); color: #c9a96e; }
.luxe-mic-btn:active:not(:disabled) { transform: scale(.92); }
.luxe-mic-btn:disabled { opacity: .3; cursor: not-allowed; }
.luxe-mic-btn.listening {
  color: #e8d5b0; background: rgba(201,169,110,.12);
  animation: luxeMicPulse 1.2s ease-in-out infinite;
}
@keyframes luxeMicPulse {
  0%,100% { box-shadow: inset 0 0 0 0 rgba(201,169,110,0); }
  50%      { box-shadow: inset 0 0 0 2px rgba(201,169,110,.3); }
}
.luxe-mic-wave { display: flex; align-items: center; gap: 2px; height: 16px; }
.luxe-mic-wave span {
  width: 2px; background: #c9a96e; border-radius: 2px;
  animation: luxeWave 0.8s ease-in-out infinite;
}
.luxe-mic-wave span:nth-child(1) { height: 6px; animation-delay: 0s; }
.luxe-mic-wave span:nth-child(2) { height: 12px; animation-delay: .15s; }
.luxe-mic-wave span:nth-child(3) { height: 6px; animation-delay: .3s; }
@keyframes luxeWave {
  0%,100% { transform: scaleY(1); opacity: .6; }
  50%      { transform: scaleY(1.5); opacity: 1; }
}

.luxe-upload-btn {
  width: 46px; flex-shrink: 0;
  background: rgba(255,255,255,.02); border: none; border-right: 1px solid rgba(201,169,110,.15);
  color: rgba(201,169,110,.5); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.luxe-upload-btn:hover:not(:disabled) { background: rgba(201,169,110,.08); color: #c9a96e; }
.luxe-upload-btn:active:not(:disabled) { transform: scale(.92); }
.luxe-upload-btn:disabled { opacity: .3; cursor: not-allowed; }

.luxe-input {
  flex: 1; min-width: 0;
  background: rgba(255,255,255,.03); border: none; color: #f5f0eb;
  font-family: 'Montserrat', sans-serif;
  font-size: 16px; font-weight: 300; padding: 14px 16px;
  outline: none; letter-spacing: .02em;
  -webkit-appearance: none; border-radius: 0;
}
.luxe-input::placeholder { color: #4a4540; }
.luxe-input:focus { background: rgba(255,255,255,.05); }

.luxe-send {
  width: 50px; background: #c9a96e; border: none; color: #0a0a0a;
  font-size: 18px; cursor: pointer; flex-shrink: 0;
  transition: background .2s, opacity .2s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  display: flex; align-items: center; justify-content: center;
}
.luxe-send:hover:not(:disabled)  { background: #e8d5b0; }
.luxe-send:active:not(:disabled) { transform: scale(.95); }
.luxe-send:disabled { opacity: .35; cursor: not-allowed; }

.luxe-cart-panel {
  position: absolute; inset: 0; top: 64px;
  background: #0e0c0a; z-index: 20;
  display: flex; flex-direction: column;
  animation: luxeCartIn .3s cubic-bezier(.4,0,.2,1);
}
@keyframes luxeCartIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.luxe-cart-header {
  padding: 14px 18px; border-bottom: 1px solid rgba(201,169,110,.15);
  display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0;
}
.luxe-cart-title { font-family: "Cormorant Garamond", serif; font-size: 20px; font-weight: 300; letter-spacing: .1em; color: #c9a96e; margin: 0; }
.luxe-cart-empty { padding: 28px 18px; color: #4a4540; font-family: "Montserrat", sans-serif; font-size: 12px; font-weight: 300; letter-spacing: .05em; }
.luxe-cart-items { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
.luxe-cart-item { display: flex; align-items: flex-start; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid rgba(201,169,110,.08); }
.luxe-cart-item-img { width: 46px; height: 56px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(201,169,110,.15); }
.luxe-cart-item-info { flex: 1; min-width: 0; }
.luxe-cart-item-name  { font-family: "Cormorant Garamond", serif; font-size: 14px; font-weight: 300; color: #f5f0eb; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.luxe-cart-item-brand { font-family: "Montserrat", sans-serif; font-size: 9px; color: #c9a96e; letter-spacing: .12em; text-transform: uppercase; margin: 3px 0 0; }
.luxe-cart-item-qty-label { font-family: "Montserrat", sans-serif; font-size: 9px; color: #4a4540; margin: 4px 0 0; }
.luxe-cart-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.luxe-cart-item-price { font-family: "Montserrat", sans-serif; font-size: 12px; color: #f5f0eb; }
.luxe-remove-item { background: none; border: none; color: rgba(201,169,110,.3); font-size: 10px; cursor: pointer; padding: 2px; line-height: 1; transition: color .2s; }
.luxe-remove-item:hover { color: #c9a96e; }

.luxe-cart-footer {
  padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(201,169,110,.12); flex-shrink: 0;
}
.luxe-cart-total { display: flex; justify-content: space-between; margin-bottom: 12px; font-family: "Montserrat", sans-serif; font-size: 13px; font-weight: 500; letter-spacing: .05em; color: #f5f0eb; }

.luxe-review-card {
  margin: 4px 0 8px 44px;
  background: rgba(201,169,110,.06);
  border: 1px solid rgba(201,169,110,.22);
  overflow: hidden; animation: luxeMsgIn .3s ease; max-width: 88%;
}
.luxe-review-header {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 14px 8px; border-bottom: 1px solid rgba(201,169,110,.12);
  background: rgba(201,169,110,.04);
}
.luxe-review-icon { color: #c9a96e; font-size: 11px; }
.luxe-review-title { font-family: "Cormorant Garamond", serif; font-size: 15px; font-weight: 400; color: #c9a96e; letter-spacing: .08em; flex: 1; }
.luxe-review-count { font-family: "Montserrat", sans-serif; font-size: 9px; color: rgba(201,169,110,.5); letter-spacing: .1em; text-transform: uppercase; }
.luxe-review-shipping { padding: 10px 14px 8px; border-bottom: 1px solid rgba(201,169,110,.08); }
.luxe-review-section-label { font-family: "Montserrat", sans-serif; font-size: 8px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: rgba(201,169,110,.4); margin: 0 0 5px; }
.luxe-review-ship-name { font-family: "Cormorant Garamond", serif; font-size: 14px; color: #f0ece6; font-weight: 400; margin: 0 0 2px; letter-spacing: .03em; }
.luxe-review-ship-addr { font-family: "Montserrat", sans-serif; font-size: 10px; color: rgba(240,236,230,.5); margin: 0; letter-spacing: .02em; line-height: 1.6; }
.luxe-review-items { padding: 10px 14px 8px; border-bottom: 1px solid rgba(201,169,110,.08); }
.luxe-review-items-scroll { max-height: 160px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(201,169,110,.2) transparent; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
.luxe-review-items-scroll::-webkit-scrollbar { width: 3px; }
.luxe-review-items-scroll::-webkit-scrollbar-thumb { background: rgba(201,169,110,.25); border-radius: 2px; }
.luxe-review-item { display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(201,169,110,.06); }
.luxe-review-item:last-child { border-bottom: none; padding-bottom: 0; }
.luxe-review-item-img { width: 36px; height: 44px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(201,169,110,.15); }
.luxe-review-item-info { flex: 1; min-width: 0; }
.luxe-review-item-name { font-family: "Cormorant Garamond", serif; font-size: 13px; color: #f0ece6; font-weight: 300; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.luxe-review-item-brand { font-family: "Montserrat", sans-serif; font-size: 8px; color: rgba(201,169,110,.5); letter-spacing: .1em; text-transform: uppercase; margin: 2px 0 0; }
.luxe-review-item-qty { font-family: "Montserrat", sans-serif; font-size: 9px; color: rgba(201,169,110,.4); margin: 2px 0 0; }
.luxe-review-item-price { font-family: "Montserrat", sans-serif; font-size: 11px; color: #c9a96e; font-weight: 500; flex-shrink: 0; }
.luxe-review-total { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-family: "Montserrat", sans-serif; font-size: 13px; font-weight: 600; color: #c9a96e; letter-spacing: .04em; border-bottom: 1px solid rgba(201,169,110,.1); }
.luxe-review-actions { display: flex; gap: 0; }
.luxe-review-edit-btn { flex: 1; background: rgba(201,169,110,.06); border: none; border-right: 1px solid rgba(201,169,110,.15); color: rgba(201,169,110,.6); font-family: "Montserrat", sans-serif; font-size: 10px; letter-spacing: .08em; padding: 11px 10px; cursor: pointer; transition: all .2s; text-transform: uppercase; -webkit-tap-highlight-color: transparent; }
.luxe-review-edit-btn:hover { background: rgba(201,169,110,.12); color: #c9a96e; }
.luxe-review-pay-btn { flex: 2; background: #ffc439; border: none; color: #003087; font-family: "Montserrat", sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .06em; padding: 11px 14px; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 7px; -webkit-tap-highlight-color: transparent; }
.luxe-review-pay-btn:hover { background: #f0b730; }
.luxe-review-pay-btn:active { transform: scale(.98); }

.luxe-paypal-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.65); backdrop-filter: blur(4px);
  z-index: 30; display: flex; align-items: flex-end;
  animation: luxeFadeIn .25s ease;
}
.luxe-paypal-sheet {
  width: 100%; background: #0e0c0a;
  border-top: 1px solid rgba(201,169,110,.25);
  padding: 20px 18px 28px;
  display: flex; flex-direction: column; gap: 12px;
  animation: luxeSlideUp .3s cubic-bezier(.4,0,.2,1);
  max-height: 92%; overflow-y: auto; position: relative;
}
@keyframes luxeSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.luxe-paypal-close { position: absolute; top: 14px; right: 16px; background: none; border: none; color: rgba(201,169,110,.4); font-size: 14px; cursor: pointer; padding: 4px; transition: color .2s; }
.luxe-paypal-close:hover { color: #c9a96e; }
.luxe-paypal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }
.luxe-paypal-mark { color: #c9a96e; font-size: 16px; }
.luxe-paypal-title { font-family: "Cormorant Garamond", serif; font-size: 20px; font-weight: 300; color: #c9a96e; letter-spacing: .08em; margin: 0; }
.luxe-paypal-order { background: rgba(201,169,110,.05); border: 1px solid rgba(201,169,110,.12); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.luxe-paypal-row { display: flex; justify-content: space-between; font-family: "Montserrat", sans-serif; font-size: 11px; color: rgba(240,236,230,.6); }
.luxe-paypal-total { display: flex; justify-content: space-between; font-family: "Montserrat", sans-serif; font-size: 13px; font-weight: 600; color: #c9a96e; border-top: 1px solid rgba(201,169,110,.15); padding-top: 8px; margin-top: 4px; }
.luxe-paypal-ship-to { font-family: "Montserrat", sans-serif; font-size: 10px; color: rgba(201,169,110,.45); margin: 0; letter-spacing: .03em; }
.luxe-paypal-ship-to strong { color: rgba(201,169,110,.75); font-weight: 500; }
.luxe-paypal-loading { display: flex; justify-content: center; gap: 5px; padding: 12px 0; }
.luxe-paypal-loading span { width: 6px; height: 6px; background: rgba(201,169,110,.4); border-radius: 50%; animation: luxeBounce 1.2s infinite; }
.luxe-paypal-loading span:nth-child(2) { animation-delay:.2s; }
.luxe-paypal-loading span:nth-child(3) { animation-delay:.4s; }
.luxe-paypal-error { font-family: "Montserrat", sans-serif; font-size: 10px; color: #e07070; background: rgba(224,112,112,.08); border: 1px solid rgba(224,112,112,.2); padding: 10px 12px; text-align: center; }
.luxe-paypal-secure { font-family: "Montserrat", sans-serif; font-size: 9px; color: rgba(201,169,110,.3); text-align: center; margin: 0; letter-spacing: .06em; }

.luxe-confirmed-sheet {
  width: 100%; background: #0e0c0a;
  border-top: 1px solid rgba(201,169,110,.25);
  padding: 28px 20px 32px;
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; text-align: center;
  animation: luxeSlideUp .35s cubic-bezier(.4,0,.2,1);
  max-height: 92%; overflow-y: auto;
}
.luxe-confirmed-check { width: 52px; height: 52px; border-radius: 50%; background: rgba(201,169,110,.12); border: 1px solid #c9a96e; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #c9a96e; animation: luxePopIn .4s cubic-bezier(.4,0,.2,1); }
@keyframes luxePopIn { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }
.luxe-confirmed-title { font-family: "Cormorant Garamond", serif; font-size: 26px; font-weight: 300; color: #c9a96e; letter-spacing: .1em; margin: 0; }
.luxe-confirmed-sub { font-family: "Montserrat", sans-serif; font-size: 11px; color: rgba(240,236,230,.55); letter-spacing: .04em; margin: 0; }
.luxe-confirmed-ref { background: rgba(201,169,110,.07); border: 1px solid rgba(201,169,110,.2); padding: 10px 20px; width: 100%; box-sizing: border-box; }
.luxe-ref-label { display: block; font-family: "Montserrat", sans-serif; font-size: 8px; letter-spacing: .18em; text-transform: uppercase; color: rgba(201,169,110,.45); margin-bottom: 4px; }
.luxe-ref-val { font-family: "Cormorant Garamond", serif; font-size: 20px; color: #c9a96e; letter-spacing: .12em; }
.luxe-confirmed-items { width: 100%; display: flex; flex-direction: column; gap: 5px; }
.luxe-confirmed-row { display: flex; justify-content: space-between; font-family: "Montserrat", sans-serif; font-size: 10px; color: rgba(240,236,230,.5); padding: 4px 0; border-bottom: 1px solid rgba(201,169,110,.07); }
.luxe-confirmed-total { display: flex; justify-content: space-between; font-family: "Montserrat", sans-serif; font-size: 13px; font-weight: 600; color: #c9a96e; padding-top: 8px; }
.luxe-confirmed-account-notice { font-family: "Montserrat", sans-serif; font-size: 10px; color: rgba(201,169,110,.7); letter-spacing: .06em; background: rgba(201,169,110,.08); border: 1px solid rgba(201,169,110,.2); padding: 7px 14px; width: 100%; box-sizing: border-box; text-align: center; }
.luxe-confirmed-account-notice.warn { color: rgba(240,200,100,.5); background: rgba(240,200,100,.05); border-color: rgba(240,200,100,.15); }
.luxe-confirmed-btns { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.luxe-co-action-outline { background: transparent !important; border: 1px solid rgba(201,169,110,.4) !important; color: #c9a96e !important; text-align: center; text-decoration: none; display: block; padding: 13px; font-family: "Montserrat", sans-serif; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; transition: all .2s; cursor: pointer; }
.luxe-co-action-outline:hover { background: rgba(201,169,110,.08) !important; border-color: #c9a96e !important; }

.luxe-co-action-btn { width: 100%; border: none; padding: 13px; background: #c9a96e; color: #0a0a0a; font-family: "Montserrat", sans-serif; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; transition: all .2s; box-shadow: 0 4px 18px rgba(201,169,110,.25); -webkit-tap-highlight-color: transparent; }
.luxe-co-action-btn:hover { background: #e8d5b0; }
.luxe-co-action-btn:active { transform: scale(.98); }
.luxe-cart-note { font-family: "Montserrat", sans-serif; font-size: 9px; font-weight: 300; color: rgba(201,169,110,.35); text-align: center; margin: 7px 0 0; letter-spacing: .05em; }

.luxe-trust-bar { padding: 0 12px 10px; animation: luxeMsgIn .3s ease; }
.luxe-trust-btn {
  width: 100%;
  background: linear-gradient(135deg, rgba(201,169,110,.12) 0%, rgba(201,169,110,.06) 100%);
  border: 1px solid rgba(201,169,110,.3); color: #c9a96e;
  font-family: "Montserrat", sans-serif; font-size: 11px; font-weight: 500;
  letter-spacing: .1em; text-transform: uppercase; padding: 11px 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all .25s; -webkit-tap-highlight-color: transparent;
  position: relative; overflow: hidden;
}
.luxe-trust-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(201,169,110,.08), transparent); transform: translateX(-100%); transition: transform .6s ease; }
.luxe-trust-btn:hover::before { transform: translateX(100%); }
.luxe-trust-btn:hover { background: linear-gradient(135deg, rgba(201,169,110,.2) 0%, rgba(201,169,110,.1) 100%); border-color: rgba(201,169,110,.55); box-shadow: 0 0 18px rgba(201,169,110,.15); }
.luxe-trust-btn:active { transform: scale(.98); }
.luxe-trust-btn:disabled { opacity: .4; cursor: not-allowed; }
.luxe-trust-icon { font-size: 13px; animation: trustPulse 2.5s ease-in-out infinite; }
@keyframes trustPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(.85); } }

@media (min-width: 480px) {
  .luxe-launcher { bottom: 24px; right: 24px; height: 50px; padding: 0 18px 0 14px; }
  .luxe-panel { inset: auto; bottom: 86px; right: 24px; width: 360px; height: 570px; border: 1px solid rgba(201,169,110,.22); box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(201,169,110,.06); padding-top: 0; padding-bottom: 0; border-radius: 0; }
  .luxe-close-panel-btn { display: none; }
  .luxe-header { padding: 14px 18px; }
  .luxe-bubble { font-size: 12.5px; }
  .luxe-bubble-wrap { max-width: 82%; }
  .luxe-input { font-size: 13px; }
  .luxe-msg-image { max-width: 160px; max-height: 140px; }
}
@media (min-width: 640px) {
  .luxe-panel { width: 390px; height: 590px; bottom: 90px; right: 28px; }
  .luxe-launcher { bottom: 28px; right: 28px; font-size: 11px; }
}
@media (min-width: 768px) {
  .luxe-panel { width: 410px; height: 600px; }
  .luxe-bubble { font-size: 13px; }
}
@media (min-width: 1024px) {
  .luxe-panel { width: 430px; height: 620px; }
  .luxe-launcher { font-size: 11.5px; height: 52px; }
}
@media (min-width: 1440px) {
  .luxe-panel { width: 450px; height: 640px; right: 36px; }
  .luxe-launcher { right: 36px; bottom: 32px; }
}

@media (prefers-reduced-motion: reduce) {
  .luxe-launcher-icon, .luxe-header-mark { animation: none; }
  .luxe-panel, .luxe-cart-panel, .luxe-backdrop { animation: none; }
  .luxe-launcher.pulse { animation: none; }
  .luxe-msg-row, .luxe-product-card { animation: none; transition: none; }
}
@media (forced-colors: active) {
  .luxe-launcher { border: 2px solid ButtonText; }
  .luxe-panel    { border: 2px solid ButtonText; }
  .luxe-bubble:not(.user) { border: 1px solid ButtonText; }
  .luxe-quick-add, .luxe-checkout-btn { background: Highlight; color: HighlightText; }
}
`;
