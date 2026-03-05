import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaTag,
  FaBox,
  FaStar,
  FaShoppingCart,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import React, { useContext } from "react";
import { Store } from "../../utils/Store";
import axios from "axios";
import { toast } from "react-toastify";
import Product from "../../models/Product";
import db from "../../utils/db";

export default function ProductScreen(props) {
  const { product } = props;
  const { state, dispatch } = useContext(Store);
  const router = useRouter();

  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="flex items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-gray-600">
            Product Not Found
          </h2>
        </div>
      </Layout>
    );
  }

  const addToCartHandler = async () => {
    const existItem = state.cart.cartItems.find((x) => x.slug === product.slug);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);

    if (data.countInStock < quantity) {
      return toast.error("Sorry. Product is out of stock");
    }

    dispatch({ type: "CART_ADD_ITEM", payload: { ...product, quantity } });
    toast.success("Added to cart!");
    router.push("/cart");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300 },
    },
  };

  const imageVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" },
    tap: { scale: 0.98 },
  };

  return (
    <Layout title={product.name}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-7xl mx-auto mb-6"
        >
          <Link href="/" legacyBehavior>
            <a className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group">
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>Back to products</span>
            </a>
          </Link>
        </motion.div>

        {/* Product Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Section */}
            <motion.div variants={imageVariants} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/5 to-gray-500/5 rounded-3xl transform group-hover:scale-105 transition-transform duration-500" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
            </motion.div>

            {/* Details Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col space-y-6"
            >
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>

              <div className="space-y-4">
                {/* Category */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center space-x-3"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <FaTag className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Category
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.category}
                    </p>
                  </div>
                </motion.div>

                {/* Brand */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center space-x-3"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <FaBox className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Brand
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.brand}
                    </p>
                  </div>
                </motion.div>

                {/* Rating */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center space-x-3"
                >
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <FaStar className="text-yellow-500" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Rating
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.rating} / 5 ({product.numReviews} reviews)
                    </p>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  variants={itemVariants}
                  className="pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {product.description}
                  </p>
                </motion.div>
              </div>

              {/* Price & Add to Cart Card */}
              <motion.div
                variants={itemVariants}
                className="mt-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg border border-gray-300 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    Price
                  </span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${product.price}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    Status
                  </span>
                  <span className="flex items-center space-x-2">
                    {product.countInStock > 0 ? (
                      <>
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-green-600 font-medium">
                          In Stock
                        </span>
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-red-500" />
                        <span className="text-red-500 font-medium">
                          Out of Stock
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={addToCartHandler}
                  disabled={product.countInStock === 0}
                  className="w-full flex items-center justify-center space-x-2 bg-black hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaShoppingCart className="text-xl" />
                  <span>Add to Cart</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { params } = context;
  const { slug } = params;

  await db.connect();
  const product = await Product.findOne({ slug }).lean();
  await db.disconnect();

  return {
    props: {
      product: product ? db.convertDocToObj(product) : null,
    },
  };
}
