import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import CheckoutWizard from "../components/CheckoutWizard";
import Layout from "../components/Layout";
import { Store } from "../utils/Store";
import {
  CreditCardIcon,
  CashIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/outline";

export default function PaymentScreen() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const { shippingAddress, paymentMethod } = cart;

  const router = useRouter();

  const submitHandler = (e) => {
    e.preventDefault();
    if (!selectedPaymentMethod) {
      return toast.error("Payment method is required");
    }
    dispatch({ type: "SAVE_PAYMENT_METHOD", payload: selectedPaymentMethod });
    Cookies.set(
      "cart",
      JSON.stringify({
        ...cart,
        paymentMethod: selectedPaymentMethod,
      }),
    );

    router.push("/placeorder");
  };

  useEffect(() => {
    if (!shippingAddress.address) {
      router.push("/shipping");
    }
    setSelectedPaymentMethod(paymentMethod || "");
  }, [paymentMethod, router, shippingAddress.address]);

  const paymentMethods = [
    {
      id: "PayPal",
      label: "PayPal",
      icon: CurrencyDollarIcon,
      description: "Fast & secure",
    },
    {
      id: "Stripe",
      label: "Stripe",
      icon: CreditCardIcon,
      description: "Credit / Debit cards",
    },
    {
      id: "CashOnDelivery",
      label: "Cash on Delivery",
      icon: CashIcon,
      description: "Pay when you receive",
    },
  ];

  return (
    <Layout title="Payment Method">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          {" "}
          {/* Increased container width */}
          {/* Animated Checkout Wizard */}
          <div className="animate-fadeInDown">
            <CheckoutWizard activeStep={2} />
          </div>
          {/* Payment Card */}
          <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20 animate-fadeInUp">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 text-center">
              Payment Method
            </h1>
            <p className="text-center text-gray-500 mb-10">
              Select how you'd like to pay
            </p>

            <form onSubmit={submitHandler} className="space-y-8">
              {/* Payment Options Grid - wider cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paymentMethods.map((method, index) => {
                  const isSelected = selectedPaymentMethod === method.id;
                  const Icon = method.icon;

                  return (
                    <label
                      key={method.id}
                      className={`
                        relative block p-8 rounded-2xl border-2 cursor-pointer
                        transition-all duration-300 transform hover:scale-105
                        animate-slideIn
                        ${
                          isSelected
                            ? "border-gray-900 bg-gray-50 shadow-lg"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }
                      `}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={() => setSelectedPaymentMethod(method.id)}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`
                          w-24 h-24 rounded-full flex items-center justify-center mb-4
                          transition-all duration-300
                          ${isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}
                        `}
                        >
                          <Icon className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                          {method.label}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {method.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center animate-popIn">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div
                className="flex justify-between pt-8 animate-slideIn"
                style={{ animationDelay: "0.4s" }}
              >
                <button
                  type="button"
                  onClick={() => router.push("/shipping")}
                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-full shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back
                </button>

                <button
                  type="submit"
                  className="px-10 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                >
                  Next
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </form>
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
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          80% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
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
        .animate-popIn {
          animation: popIn 0.3s ease-out forwards;
        }
      `}</style>
    </Layout>
  );
}

PaymentScreen.auth = true;
