import React, { useState } from "react";

const Rating = ({
  rating: initialRating = 0,
  size = 48,
  onChange,
  readonly = false,
  className = "",
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeStar, setActiveStar] = useState(null);

  const handleMouseEnter = (index) => {
    if (!readonly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(0);
  };

  const handleClick = (index) => {
    if (!readonly) {
      setRating(index);
      setActiveStar(index);
      setTimeout(() => setActiveStar(null), 800);
      if (onChange) onChange(index);
    }
  };

  return (
    <div className={`cosmic-rating ${className}`}>
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = (hoverRating || rating) >= star;
          const isActive = activeStar === star;

          return (
            <div
              key={star}
              className={`star-wrapper ${!readonly ? "interactive" : ""}`}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(star)}
            >
              <div
                className={`star ${filled ? "filled" : ""} ${isActive ? "active" : ""}`}
              >
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id={`grad-${star}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="50%" stopColor="#FF8C00" />
                      <stop offset="100%" stopColor="#FF1493" />
                    </linearGradient>
                    <filter id="glow-${star}">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <clipPath id="starClip">
                      <path d="M50 5 L61 35 L95 35 L68 55 L79 85 L50 68 L21 85 L32 55 L5 35 L39 35 Z" />
                    </clipPath>
                  </defs>

                  {/* Star shape with crystalline edges */}
                  <path
                    d="M50 5 L61 35 L95 35 L68 55 L79 85 L50 68 L21 85 L32 55 L5 35 L39 35 Z"
                    fill={
                      filled ? `url(#grad-${star})` : "rgba(255,255,255,0.1)"
                    }
                    stroke="url(#grad-1)"
                    strokeWidth="2"
                    filter={filled ? `url(#glow-${star})` : "none"}
                    className="star-path"
                  />

                  {/* Inner geometric pattern (only when filled) */}
                  {filled && (
                    <>
                      <polygon
                        points="50,30 60,45 50,60 40,45"
                        fill="white"
                        opacity="0.4"
                        className="inner-shape"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 50 45"
                          to="360 50 45"
                          dur="8s"
                          repeatCount="indefinite"
                        />
                      </polygon>
                      <circle cx="50" cy="45" r="5" fill="white" opacity="0.6">
                        <animate
                          attributeName="r"
                          values="5;7;5"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                </svg>

                {/* Orbiting particles */}
                {filled && (
                  <div className="particle-orbit">
                    {[...Array(3)].map((_, i) => (
                      <span
                        key={i}
                        className="particle"
                        style={{ "--i": i }}
                      ></span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .cosmic-rating {
          display: inline-block;
          background: rgba(5, 5, 20, 0.7);
          backdrop-filter: blur(10px);
          padding: 20px 30px;
          border-radius: 80px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          box-shadow: 0 0 50px rgba(255, 20, 147, 0.3);
        }

        .stars-container {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .star-wrapper {
          position: relative;
          cursor: ${readonly ? "default" : "pointer"};
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .star-wrapper.interactive:hover {
          transform: scale(1.2) rotate(5deg);
        }

        .star {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .star-path {
          transition: all 0.3s ease;
        }

        .filled .star-path {
          animation: colorPulse 4s infinite alternate;
        }

        /* Active star (clicked) ripple */
        .star.active::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(255, 215, 0, 0.8) 0%,
            transparent 70%
          );
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: ripple 0.8s ease-out forwards;
          pointer-events: none;
          z-index: -1;
        }

        /* Orbiting particles */
        .particle-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: gold;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          box-shadow: 0 0 10px #ffaa00;
          animation: orbit 3s linear infinite;
          animation-delay: calc(var(--i) * -1s);
        }

        @keyframes orbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg) translateX(30px)
              rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg) translateX(30px)
              rotate(-360deg);
          }
        }

        @keyframes colorPulse {
          0% {
            filter: hue-rotate(0deg) brightness(1);
          }
          100% {
            filter: hue-rotate(30deg) brightness(1.3);
          }
        }

        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        .inner-shape {
          animation: morph 5s infinite alternate;
        }

        @keyframes morph {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.2) rotate(10deg);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default Rating;
