import Image from "next/image";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const images = [
  "/images/63.png",
  "/images/64.png",
  "/images/65.png",
  "/images/67.png",
  "/images/68.png",
  "/images/69.png",
  "/images/71.png",
  "/images/78.jpg",
  "/images/79.jpg",
  "/images/61.png",
  "/images/62.png",
  "/images/80.jpg",
  "/images/81.png",
];

export default function ProductCarousel() {
  return (
    <div className="modern-carousel">
      <Carousel
        autoPlay
        interval={3500}
        infiniteLoop
        showArrows
        showThumbs={false}
        showStatus={false} // removes "1 of 8"
        showIndicators
        swipeable
        emulateTouch
        transitionTime={600}
      >
        {images.map((src, index) => (
          <div key={index} className="slide">
            <Image
              src={src}
              alt="YouTube thumbnail"
              fill
              priority={index === 0}
              className="carousel-image"
            />
          </div>
        ))}
      </Carousel>

      <style jsx>{`
        .modern-carousel {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
        }

        /* 🔑 REQUIRED HEIGHT FOR 16:9 */
        .slide {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
        }

        .carousel-image {
          object-fit: cover;
        }

        /* Dots */
        :global(.carousel .control-dots) {
          bottom: 16px;
        }

        :global(.carousel .control-dots .dot) {
          background: rgba(255, 255, 255, 0.55);
          width: 10px;
          height: 10px;
          transition: 0.3s;
        }

        :global(.carousel .control-dots .dot.selected) {
          background: white;
          transform: scale(1.3);
        }

        /* Arrows */
        :global(.carousel .control-arrow) {
          background: rgba(0, 0, 0, 0.45);
          border-radius: 50%;
          width: 44px;
          height: 44px;
        }

        :global(.carousel .control-arrow:hover) {
          background: rgba(0, 0, 0, 0.65);
        }
      `}</style>
    </div>
  );
}
