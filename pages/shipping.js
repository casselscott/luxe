import React, { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import Cookies from "js-cookie";
import CheckoutWizard from "../components/CheckoutWizard";
import Layout from "../components/Layout";
import { Store } from "../utils/Store";
import { useRouter } from "next/router";

// Simple SVG icons (you can replace with @heroicons/react if preferred)
const UserIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const AddressIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const CityIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const PostalIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const CountryIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function ShippingScreen() {
  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
  } = useForm();

  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const { shippingAddress } = cart;
  const router = useRouter();

  useEffect(() => {
    setValue("fullName", shippingAddress.fullName || "");
    setValue("address", shippingAddress.address || "");
    setValue("city", shippingAddress.city || "");
    setValue("postalCode", shippingAddress.postalCode || "");
    setValue("country", shippingAddress.country || "");
  }, [setValue, shippingAddress]);

  const submitHandler = ({ fullName, address, city, postalCode, country }) => {
    dispatch({
      type: "SAVE_SHIPPING_ADDRESS",
      payload: { fullName, address, city, postalCode, country },
    });
    Cookies.set(
      "cart",
      JSON.stringify({
        ...cart,
        shippingAddress: {
          fullName,
          address,
          city,
          postalCode,
          country,
        },
      }),
    );
    router.push("/payment");
  };

  return (
    <Layout title="Shipping Address">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Animated Checkout Wizard */}
          <div className="animate-fadeInDown">
            <CheckoutWizard activeStep={1} />
          </div>

          {/* Form Card */}
          <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 animate-fadeInUp">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 text-center">
              Shipping Address
            </h1>
            <p className="text-center text-gray-500 mb-8">
              Where should we deliver your order?
            </p>

            <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
              {/* Full Name */}
              <div
                className="animate-slideIn"
                style={{ animationDelay: "0.1s" }}
              >
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? "border-red-500" : "border-gray-300"} rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm`}
                    placeholder="John Doe"
                    {...register("fullName", {
                      required: "Please enter full name",
                    })}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 animate-shake">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div
                className="animate-slideIn"
                style={{ animationDelay: "0.2s" }}
              >
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AddressIcon />
                  </div>
                  <input
                    id="address"
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border ${errors.address ? "border-red-500" : "border-gray-300"} rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm`}
                    placeholder="123 Main St"
                    {...register("address", {
                      required: "Please enter address",
                      minLength: {
                        value: 3,
                        message: "Address must be at least 3 characters",
                      },
                    })}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 animate-shake">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* City & Postal Code (side by side on larger screens) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="animate-slideIn"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CityIcon />
                    </div>
                    <input
                      id="city"
                      type="text"
                      className={`w-full pl-10 pr-4 py-3 border ${errors.city ? "border-red-500" : "border-gray-300"} rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm`}
                      placeholder="New York"
                      {...register("city", { required: "Please enter city" })}
                    />
                  </div>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 animate-shake">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div
                  className="animate-slideIn"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Postal Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PostalIcon />
                    </div>
                    <input
                      id="postalCode"
                      type="text"
                      className={`w-full pl-10 pr-4 py-3 border ${errors.postalCode ? "border-red-500" : "border-gray-300"} rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm`}
                      placeholder="10001"
                      {...register("postalCode", {
                        required: "Please enter postal code",
                      })}
                    />
                  </div>
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600 animate-shake">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div
                className="animate-slideIn"
                style={{ animationDelay: "0.5s" }}
              >
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Country
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CountryIcon />
                  </div>
                  <input
                    id="country"
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border ${errors.country ? "border-red-500" : "border-gray-300"} rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm`}
                    placeholder="United States"
                    {...register("country", {
                      required: "Please enter country",
                    })}
                  />
                </div>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600 animate-shake">
                    {errors.country.message}
                  </p>
                )}
              </div>

              {/* Next Button */}
              <div
                className="flex justify-end pt-4 animate-slideIn"
                style={{ animationDelay: "0.6s" }}
              >
                <button
                  type="submit"
                  className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Continue to Payment
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
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
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
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </Layout>
  );
}

ShippingScreen.auth = true;
