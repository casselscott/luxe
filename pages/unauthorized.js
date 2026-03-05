import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";

const DESTINATIONS = [
  {
    name: "Santorini",
    country: "Greece",
    img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90&fit=crop",
    tagline: "Where the sea meets the sky",
  },
  {
    name: "Kyoto",
    country: "Japan",
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&q=90&fit=crop",
    tagline: "Ancient paths through eternal beauty",
  },
  {
    name: "Amalfi Coast",
    country: "Italy",
    img: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=1400&q=90&fit=crop",
    tagline: "Cliffs kissed by the Mediterranean",
  },
  {
    name: "Marrakech",
    country: "Morocco",
    img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1400&q=90&fit=crop",
    tagline: "A labyrinth of colour and light",
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90&fit=crop",
    tagline: "Paradise suspended above turquoise",
  },
  {
    name: "Patagonia",
    country: "Argentina",
    img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90&fit=crop",
    tagline: "Where the world ends and wonder begins",
  },
];

// CSS as a plain string — injected via useEffect so SSR never touches it
const UNAUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Jost:wght@200;300;400;500&display=swap');

.unauth-root {
  position: fixed; inset: 0; overflow: hidden;
  font-family: 'Jost', sans-serif; background: #0a0a0a;
}
.slide-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
}
.slide-bg.entering { animation: slideReveal 0.9s cubic-bezier(0.77,0,0.18,1) forwards; }
.slide-bg.leaving  { animation: slideExit  0.9s cubic-bezier(0.77,0,0.18,1) forwards; }
@keyframes slideReveal {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0%   0 0); }
}
@keyframes slideExit {
  from { opacity: 1; }
  to   { opacity: 0; }
}
.slide-bg::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.2) 50%,rgba(0,0,0,.55) 100%);
}
.grain {
  position: absolute; inset: 0; z-index: 2;
  opacity: .045; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px;
}
.dest-counter {
  position: absolute; top: 32px; right: 36px; z-index: 10;
  font-family: 'Playfair Display', serif; font-size: 13px;
  color: rgba(255,255,255,.5); letter-spacing: .2em;
}
.dest-counter strong { color: rgba(255,255,255,.9); font-size: 16px; font-weight: 400; }
.unauth-content {
  position: absolute; inset: 0; z-index: 5;
  display: flex; flex-direction: column; justify-content: center;
  padding: 0 8vw; max-width: 820px;
}
.unauth-eyebrow {
  font-size: 11px; font-weight: 400; letter-spacing: .3em;
  text-transform: uppercase; color: rgba(255,255,255,.5); margin-bottom: 20px;
  transition: opacity .4s, transform .4s;
}
.unauth-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
  backdrop-filter: blur(12px); padding: 8px 16px;
  margin-bottom: 28px; width: fit-content;
  transition: opacity .4s, transform .4s;
}
.badge-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #ff4f4f;
  animation: badgePulse 2s ease-in-out infinite;
}
@keyframes badgePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(255,79,79,.5); }
  50%     { box-shadow: 0 0 0 5px rgba(255,79,79,0); }
}
.badge-text {
  font-size: 11px; letter-spacing: .2em;
  text-transform: uppercase; color: rgba(255,255,255,.7);
}
.unauth-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(42px,7vw,88px); font-weight: 400;
  line-height: 1.05; color: #fff; margin: 0 0 8px;
  transition: opacity .5s, transform .5s;
}
.unauth-headline em { font-style: italic; color: rgba(255,255,255,.6); }
.unauth-dest {
  font-family: 'Playfair Display', serif;
  font-size: clamp(48px,8vw,104px); font-weight: 700;
  line-height: 1; color: #fff; margin: 0 0 6px;
  transition: opacity .5s, transform .5s;
}
.unauth-country {
  font-size: 13px; letter-spacing: .28em; text-transform: uppercase;
  color: rgba(255,255,255,.45); margin-bottom: 32px;
  transition: opacity .4s, transform .4s;
}
.unauth-divider {
  height: 1px; background: rgba(255,255,255,.25); margin-bottom: 28px;
  transition: opacity .4s, width .6s;
}
.unauth-tagline {
  font-size: 15px; font-weight: 200; color: rgba(255,255,255,.55);
  letter-spacing: .04em; margin-bottom: 48px; font-style: italic;
  transition: opacity .4s, transform .4s;
}
.unauth-message {
  font-size: 12px; letter-spacing: .08em; color: rgba(255,100,100,.8);
  background: rgba(255,80,80,.1); border-left: 2px solid rgba(255,80,80,.5);
  padding: 10px 16px; margin-bottom: 32px; width: fit-content;
  transition: opacity .4s;
}
.unauth-actions {
  display: flex; gap: 14px; flex-wrap: wrap;
  transition: opacity .4s, transform .4s;
}
.ua-hidden { opacity: 0; transform: translateY(14px); }
.ua-visible { opacity: 1; transform: translateY(0); }
.ua-div-hidden { opacity: 0; width: 0; }
.ua-div-visible { opacity: 1; width: 48px; }
.ua-d1 { transition-delay: .05s; }
.ua-d2 { transition-delay: .10s; }
.ua-d3 { transition-delay: .15s; }
.ua-d4 { transition-delay: .20s; }
.ua-d5 { transition-delay: .25s; }
.ua-d6 { transition-delay: .28s; }
.ua-d7 { transition-delay: .30s; }
.ua-d8 { transition-delay: .35s; }
.unauth-btn-primary {
  padding: 14px 32px; background: #fff; color: #0a0a0a;
  font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500;
  letter-spacing: .18em; text-transform: uppercase;
  border: none; cursor: pointer; text-decoration: none; display: inline-block;
  transition: background .2s, transform .2s;
}
.unauth-btn-primary:hover { background: rgba(255,255,255,.88); transform: translateY(-1px); }
.unauth-btn-ghost {
  padding: 14px 32px; background: transparent; color: rgba(255,255,255,.65);
  font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
  letter-spacing: .18em; text-transform: uppercase;
  border: 1px solid rgba(255,255,255,.22); cursor: pointer;
  text-decoration: none; display: inline-block; backdrop-filter: blur(8px);
  transition: border-color .2s, color .2s, transform .2s;
}
.unauth-btn-ghost:hover { border-color: rgba(255,255,255,.55); color: #fff; transform: translateY(-1px); }
.slide-dots {
  position: absolute; bottom: 36px; left: 8vw;
  z-index: 10; display: flex; gap: 10px; align-items: center;
}
.slide-dot {
  width: 28px; height: 2px; background: rgba(255,255,255,.25);
  cursor: pointer; border: none; padding: 0;
  transition: background .3s, width .3s;
}
.slide-dot.active { background: rgba(255,255,255,.9); width: 48px; }
.slide-dot:hover:not(.active) { background: rgba(255,255,255,.5); }
.slide-progress {
  position: absolute; bottom: 0; left: 0; height: 2px;
  background: rgba(255,255,255,.35); z-index: 10;
  animation: progressFill 5s linear forwards;
}
@keyframes progressFill { from { width: 0%; } to { width: 100%; } }
.dest-list {
  position: absolute; bottom: 28px; right: 36px;
  z-index: 10; text-align: right;
  display: flex; flex-direction: column; gap: 4px;
}
.dest-list-item {
  font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
  color: rgba(255,255,255,.2); cursor: pointer; transition: color .2s;
  background: none; border: none; text-align: right; padding: 2px 0;
  font-family: 'Jost', sans-serif;
}
.dest-list-item.active { color: rgba(255,255,255,.75); }
.dest-list-item:hover:not(.active) { color: rgba(255,255,255,.45); }

/* Break out of Layout's container padding/margin */
.unauth-breakout {
  margin: -1rem -1rem 0;
}
`;

export default function Unauthorized() {
  const router = useRouter();
  const { message } = router.query;
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Inject CSS and mark mounted — both happen only on the client
  useEffect(() => {
    setMounted(true);
    const id = "unauth-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = UNAUTH_CSS;
    document.head.appendChild(el);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  // Auto-advance slider
  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(
      () => goTo((current + 1) % DESTINATIONS.length),
      5000,
    );
    return () => clearInterval(t);
  }, [current, mounted]);

  const goTo = (idx) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTextVisible(false);
    setPrev(current);
    setTimeout(() => {
      setCurrent(idx);
      setTimeout(() => {
        setTextVisible(true);
        setAnimating(false);
        setPrev(null);
      }, 400);
    }, 600);
  };

  // Server render and first client render are identical (plain fallback).
  // After mount, React re-renders with the full experience — no mismatch.
  if (!mounted) {
    return (
      <Layout title="Access Denied" noFooter>
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Access Denied
            </div>
            {message && (
              <div style={{ fontSize: 12, color: "rgba(255,100,100,0.7)" }}>
                {message}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const dest = DESTINATIONS[current];
  const prevDest = prev !== null ? DESTINATIONS[prev] : null;
  const v = textVisible;

  return (
    <Layout title="Access Denied" noFooter>
      <div className="unauth-breakout">
        <div className="unauth-root">
          {/* Exiting slide */}
          {prevDest && (
            <div
              className="slide-bg leaving"
              style={{ backgroundImage: `url(${prevDest.img})` }}
            />
          )}

          {/* Active slide */}
          <div
            key={current}
            className={`slide-bg${animating ? " entering" : ""}`}
            style={{ backgroundImage: `url(${dest.img})` }}
          />

          {/* Film grain */}
          <div className="grain" />

          {/* Counter */}
          <div className="dest-counter">
            <strong>{String(current + 1).padStart(2, "0")}</strong>
            {" / "}
            {String(DESTINATIONS.length).padStart(2, "0")}
          </div>

          {/* Main content */}
          <div className="unauth-content">
            <div
              className={`unauth-eyebrow ua-d1 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              Fashion House · Restricted Area
            </div>

            <div
              className={`unauth-badge ua-d2 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              <div className="badge-dot" />
              <span className="badge-text">Access Denied</span>
            </div>

            <h1
              className={`unauth-headline ua-d3 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              You belong somewhere <em>far</em>
            </h1>

            <h2
              className={`unauth-dest ua-d4 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              {dest.name}
            </h2>

            <p
              className={`unauth-country ua-d5 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              {dest.country}
            </p>

            <div
              className={`unauth-divider ua-d6 ${v ? "ua-div-visible" : "ua-div-hidden"}`}
            />

            <p
              className={`unauth-tagline ua-d7 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              &ldquo;{dest.tagline}&rdquo;
            </p>

            {message && (
              <div
                className={`unauth-message ua-d8 ${v ? "ua-visible" : "ua-hidden"}`}
              >
                {message}
              </div>
            )}

            <div
              className={`unauth-actions ua-d8 ${v ? "ua-visible" : "ua-hidden"}`}
            >
              <a href="/login" className="unauth-btn-primary">
                Sign In
              </a>
              <a href="/" className="unauth-btn-ghost">
                Return Home
              </a>
            </div>
          </div>

          {/* Progress bar — key resets animation on each slide */}
          <div key={`p-${current}`} className="slide-progress" />

          {/* Dot nav */}
          <div className="slide-dots">
            {DESTINATIONS.map((_, i) => (
              <button
                key={i}
                className={`slide-dot${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to ${DESTINATIONS[i].name}`}
              />
            ))}
          </div>

          {/* Destination list */}
          <div className="dest-list">
            {DESTINATIONS.map((d, i) => (
              <button
                key={i}
                className={`dest-list-item${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
