import React from "react";

const GlowingButton = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  ...rest
}) => {
  return (
    <div className={`unique-wrapper ${className}`}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="unique-button"
        {...rest}
      >
        <span className="unique-text">{children}</span>
      </button>

      <style jsx>{`
        .unique-wrapper {
          display: inline-block;
          border-radius: 40px;
          isolation: isolate;
        }

        .unique-button {
          position: relative;
          background: #2d2d3f;
          border: none;
          border-radius: 40px;
          padding: 12px 32px;
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: white;
          cursor: pointer;
          overflow: hidden;
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 1;
        }

        /* The "blob" – a circular gradient that expands on hover */
        .unique-button::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle at center, #ff6b6b, #ff4757);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
        }

        .unique-button:hover::before {
          transform: translate(-50%, -50%) scale(2);
        }

        .unique-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
        }

        /* Keep text above the blob and give it a subtle lift */
        .unique-text {
          position: relative;
          display: inline-block;
          transition: transform 0.3s ease;
        }

        .unique-button:hover .unique-text {
          transform: scale(1.02);
        }

        /* Disabled state */
        .unique-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .unique-button:disabled::before {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default GlowingButton;
