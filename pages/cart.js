import Image from "next/image";
import Link from "next/link";
import React, { useContext } from "react";
import {
  XCircleIcon,
  ShoppingBagIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@heroicons/react/outline";
import Layout from "../components/Layout";
import { Store } from "../utils/Store";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast } from "react-toastify";

function CartScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  const removeItemHandler = (item) => {
    dispatch({ type: "CART_REMOVE_ITEM", payload: item });
    toast.info("Item removed from cart");
  };

  const updateCartHandler = async (item, quantity) => {
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      return toast.error("Sorry. Product is out of stock");
    }

    dispatch({ type: "CART_ADD_ITEM", payload: { ...item, quantity } });
    toast.success("Cart updated");
  };

  const subtotal = cartItems.reduce((a, c) => a + c.quantity * c.price, 0);
  const itemCount = cartItems.reduce((a, c) => a + c.quantity, 0);

  return (
    <Layout title="Shopping Cart">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header with Animation */}
          <div className="text-center mb-10 animate-fadeInDown">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              Your Shopping Cart
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              {itemCount === 0
                ? "Your cart is empty"
                : `You have ${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`}
            </p>
          </div>

          {cartItems.length === 0 ? (
            // Empty State with Animation
            <div className="flex flex-col items-center justify-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl animate-fadeInUp">
              <ShoppingBagIcon className="h-24 w-24 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Looks like you haven't added anything yet.
              </p>
              <Link href="/" legacyBehavior>
                <a className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Continue Shopping
                </a>
              </Link>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Cart Items - Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-4 animate-fadeInUp">
                {cartItems.map((item, index) => (
                  <div
                    key={item.slug}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100 animate-slideIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Product Image */}
                      <div className="sm:w-32 h-32 bg-gray-100 flex items-center justify-center p-2">
                        <div className="relative w-24 h-24">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <Link href={`/product/${item.slug}`} legacyBehavior>
                              <a className="text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors">
                                {item.name}
                              </a>
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">
                              Unit Price: ${item.price}
                            </p>
                          </div>

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between sm:justify-end mt-4 sm:mt-0 space-x-4">
                            <div className="flex items-center">
                              <label
                                htmlFor={`qty-${item.slug}`}
                                className="sr-only"
                              >
                                Quantity
                              </label>
                              <select
                                id={`qty-${item.slug}`}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateCartHandler(
                                    item,
                                    Number(e.target.value),
                                  )
                                }
                                className="block w-20 px-3 py-2 bg-gray-50 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                              >
                                {[...Array(item.countInStock).keys()].map(
                                  (x) => (
                                    <option key={x + 1} value={x + 1}>
                                      {x + 1}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                            <div className="text-lg font-bold text-gray-800 w-20 text-right">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <button
                              onClick={() => removeItemHandler(item)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary - Right Column */}
              <div
                className="lg:col-span-1 mt-8 lg:mt-0 animate-fadeInUp"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sticky top-24 border border-white/20">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Order Summary
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal ({itemCount} items)</span>
                      <span className="font-semibold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>Calculated at next step</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("login?redirect=/shipping")}
                    className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center group"
                  >
                    <span>Proceed to Checkout</span>
                    <ChevronRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="mt-4 text-center">
                    <Link href="/" legacyBehavior>
                      <a className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        Continue Shopping
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
        .animate-slideIn {
          opacity: 0;
          animation: slideIn 0.6s ease-out forwards;
        }
      `}</style>
    </Layout>
  );
}

export default dynamic(() => Promise.resolve(CartScreen), { ssr: false });
