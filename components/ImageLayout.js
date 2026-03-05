import Image from "next/image";
import { useState, useEffect } from "react";

const ImageLayout = ({ images = [], interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!images.length) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setAnimationKey((prev) => prev + 1); // force remount
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (!images.length) return null;

  const animations = ["pop", "shake", "whip", "rise", "tumble"];
  const currentAnimation = animations[currentIndex % animations.length];
  const currentImage = images[currentIndex];

  return (
    <div className="carousel-container">
      <div key={animationKey} className={`slide animate-${currentAnimation}`}>
        <Image
          src={currentImage.src}
          alt={currentImage.alt || "Banner image"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Dots */}
      <div className="dots">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentIndex ? "active" : ""}`}
            onClick={() => {
              setCurrentIndex(idx);
              setAnimationKey((k) => k + 1);
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .carousel-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 1; /* LinkedIn banner ratio */
          overflow: hidden;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .slide {
          position: absolute;
          inset: 0;
        }

        /* Animations */
        .animate-pop {
          animation: pop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-shake {
          animation: shake 0.7s ease-out;
        }

        .animate-whip {
          animation: whip 0.7s ease-out;
        }

        .animate-rise {
          animation: rise 0.8s ease-out;
        }

        .animate-tumble {
          animation: tumble 0.9s ease-out;
        }

        @keyframes pop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0% {
            transform: translateX(-40px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes whip {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes rise {
          0% {
            transform: translateY(40px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes tumble {
          0% {
            transform: rotate(-10deg) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: rotate(0) scale(1);
            opacity: 1;
          }
        }

        .dots {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
        }

        .dot.active {
          background: white;
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
};

export default ImageLayout;
