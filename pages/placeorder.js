import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import CheckoutWizard from "../components/CheckoutWizard";
import Layout from "../components/Layout";
import { getError } from "../utils/error";
import { Store } from "../utils/Store";
import {
  LocationMarkerIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ReceiptTaxIcon,
  TruckIcon,
  PencilAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/outline";

export default function PlaceOrderScreen() {
  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const { cartItems, shippingAddress, paymentMethod } = cart;

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

  const itemsPrice = round2(
    cartItems.reduce((a, c) => a + c.quantity * c.price, 0),
  );
  const shippingPrice = itemsPrice > 200 ? 0 : 15;
  const taxPrice = round2(itemsPrice * 0.15);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  const router = useRouter();
  useEffect(() => {
    if (!paymentMethod) {
      router.push("/payment");
    }
  }, [paymentMethod, router]);

  const [loading, setLoading] = useState(false);

  const placeOrderHandler = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post("/api/orders", {
        orderItems: cartItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      });
      setLoading(false);
      dispatch({ type: "CART_CLEAR_ITEMS" });
      Cookies.set(
        "cart",
        JSON.stringify({
          ...cart,
          cartItems: [],
        }),
      );
      router.push(`/order/${data._id}`);
    } catch (err) {
      setLoading(false);
      toast.error(getError(err));
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout title="Place Order">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShoppingBagIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Your cart is empty
            </h2>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Place Order">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Animated Checkout Wizard */}
          <div className="animate-fadeInDown">
            <CheckoutWizard activeStep={3} />
          </div>

          {/* Page Title */}
          <div className="text-center mt-8 mb-10 animate-fadeInUp">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              Review Your Order
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              Please verify your details before placing the order
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left Column - Shipping, Payment, Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address Card */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 animate-slideInLeft">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                      <LocationMarkerIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Shipping Address
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {shippingAddress.fullName}, {shippingAddress.address},{" "}
                        {shippingAddress.city}, {shippingAddress.postalCode},{" "}
                        {shippingAddress.country}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/shipping"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <PencilAltIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              {/* Payment Method Card */}
              <div
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 animate-slideInLeft"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                      <CreditCardIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Payment Method
                      </h2>
                      <p className="text-gray-600 mt-1">{paymentMethod}</p>
                    </div>
                  </div>
                  <Link
                    href="/payment"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <PencilAltIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              {/* Order Items Card */}
              <div
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 animate-slideInLeft"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                      <ShoppingBagIcon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Order Items
                    </h2>
                  </div>
                  <Link
                    href="/cart"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <PencilAltIcon className="h-5 w-5" />
                  </Link>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="pb-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="pb-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="pb-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="pb-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cartItems.map((item, index) => (
                        <tr
                          key={item._id}
                          className="animate-fadeIn"
                          style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                        >
                          <td className="py-4">
                            <Link
                              href={`/product/${item.slug}`}
                              className="flex items-center group"
                            >
                              <div className="relative w-12 h-12 flex-shrink-0 mr-3">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <span className="text-gray-800 group-hover:text-gray-600 transition-colors">
                                {item.name}
                              </span>
                            </Link>
                          </td>
                          <td className="py-4 text-right text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="py-4 text-right text-gray-700">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="py-4 text-right font-semibold text-gray-800">
                            ${(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 sticky top-24 animate-slideInRight">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                    <ReceiptTaxIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Items</span>
                    <span className="font-medium text-gray-800">
                      ${itemsPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-800">
                      {shippingPrice === 0
                        ? "Free"
                        : `$${shippingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium text-gray-800">
                      ${taxPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={placeOrderHandler}
                  disabled={loading}
                  className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Place Order
                    </>
                  )}
                </button>

                {/* Trust Badge */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing your order, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            </div>
          </div>
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
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
        .animate-slideInLeft {
          opacity: 0;
          animation: slideInLeft 0.6s ease-out forwards;
        }
        .animate-slideInRight {
          opacity: 0;
          animation: slideInRight 0.6s ease-out forwards;
        }
        .animate-fadeIn {
          opacity: 0;
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </Layout>
  );
}

PlaceOrderScreen.auth = true;
