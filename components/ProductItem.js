import Link from "next/link";
import React from "react";
import StarRating from "../components/StarRating";
import Image from "next/image";
import GlowingButton from "./GlowingButton";

export default function ProductItem({ product, addToCartHandler }) {
  return (
    <div className="product-card group h-full flex flex-col">
      {/* Image */}
      <Link
        href={`/product/${product.slug}`}
        className="block overflow-hidden rounded-t-2xl"
      >
        <Image
          width={600}
          height={900}
          src={product.image}
          alt={product.name}
          className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      {/* Product details */}
      <div className="p-6 bg-white flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h2 className="text-black font-semibold text-lg hover:text-gray-700 transition-colors">
            {product.name}
          </h2>
        </Link>

        <p className="mt-1 text-gray-600 font-medium">{product.brand}</p>

        <p className="mt-2 text-xl font-bold text-gray-900">${product.price}</p>

        <div className="mt-2">
          <StarRating rating={product.rating} numReviews={product.numReviews} />
        </div>

        {/* Button pinned to bottom and centered */}
        <div className="mt-auto pt-6 flex justify-center">
          <div
            className="glowing-box"
            onClick={() => addToCartHandler(product)}
          >
            <div className="glowing-box-animations">
              <div className="glowing-box-borders" />
              <div className="glowing-box-glow" />
              <div className="glowing-box-stars" />
            </div>
            <div className="glowing-box-borders-masker" />
            <GlowingButton className="glowing-box-button">
              <span className="glowing-span">Add to cart</span>
            </GlowingButton>
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-card {
          background: white;
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
          transition: all 0.35s ease;
        }

        .product-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow:
            0 20px 40px -10px rgba(0, 0, 0, 0.2),
            0 0 0 2px rgba(194, 156, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
