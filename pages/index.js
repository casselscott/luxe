// pages/index.js
import { useContext } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ProductCarousel from "@/components/Carousel";

import Layout from "../components/Layout";
import ImageLayout from "@/components/ImageLayout";
import ProductItem from "../components/ProductItem";
import DisplayImage from "@/components/DisplayImage";

import Product from "../models/Product";
import db from "../utils/db";
import { Store } from "../utils/Store";

// Client-only chatbot
const ChatbotWidget = dynamic(() => import("@/components/ChatbotWidget"), {
  ssr: false,
  loading: () => null,
});

export default function Home({ products }) {
  const { state, dispatch } = useContext(Store);
  const { cart } = state;

  const addToCartHandler = async (product) => {
    const existItem = cart.cartItems.find((x) => x.slug === product.slug);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      return toast.error("Sorry. Product is out of stock");
    }
    dispatch({ type: "CART_ADD_ITEM", payload: { ...product, quantity } });
    toast.success("Product added to the cart");
  };

  return (
    <Layout title="">
      {/* ── Hero Carousel ── */}
      <section className="home-carousel-section">
        <ProductCarousel />
      </section>

      {/* ── Editorial Image Grid ── */}
      <section className="home-image-section section-gap">
        <ImageLayout
          images={[
            {
              src: "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707561/76_uagtxq.png",
              alt: "Spring fashion",
            },
            {
              src: "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707405/73_yhojim.png",
              alt: "Summer vibe",
            },
            {
              src: "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707414/74_fymqhr.png",
              alt: "Autumn leaves",
            },
            {
              src: "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707555/75_eizzrt.png",
              alt: "Winter glow",
            },
            {
              src: "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707564/77_uiey4a.png",
              alt: "Urban style",
            },
          ]}
          interval={4000}
        />
      </section>

      {/* ── Product Grid with eye‑catching animated heading ── */}
      <section className="home-products-section section-gap">
        <div className="max-w-7xl mx-auto px-6">
          {/* Animated heading – typewriter + bounce + shift */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.03, delayChildren: 0.2 },
              },
            }}
            className="text-2xl font-bold mb-6 text-gray-900"
            style={{
              animation: "glowPulse 2s ease-in-out infinite",
              display: "inline-block",
            }}
          >
            {/* Split "Hottest Picks this Week" into characters (including spaces) */}
            {Array.from("Hottest Picks this Week").map((char, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20, x: -5, rotate: -5 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    rotate: 0,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 8,
                      mass: 0.5,
                    },
                  },
                }}
                whileHover={{ scale: 1.2, color: "#f59e0b" }}
                style={{
                  display: "inline-block",
                  whiteSpace: char === " " ? "pre" : "normal",
                }}
              >
                {char}
              </motion.span>
            ))}

            {/* Fire emoji with its own wiggle */}
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
              style={{ display: "inline-block", marginLeft: "0.25rem" }}
            >
              🔥
            </motion.span>
          </motion.div>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductItem
                key={product.slug}
                product={product}
                addToCartHandler={addToCartHandler}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Scrolling Image Strip ── */}
      <section className="home-strip-section section-gap">
        <div className="overflow-hidden">
          <div className="grid grid-flow-col auto-cols-max animate-scroll">
            <DisplayImage />
            <DisplayImage />
          </div>
        </div>
      </section>

      {/* ── LUXE Chatbot ── */}
      <ChatbotWidget />

      {/* Glow keyframes animation */}
      <style jsx>{`
        @keyframes glowPulse {
          0% {
            text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          }
          100% {
            text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
          }
        }
      `}</style>
    </Layout>
  );
}

export async function getServerSideProps() {
  await db.connect();
  const products = await Product.find().lean();
  return {
    props: {
      products: products.map(db.convertDocToObj),
    },
  };
}
