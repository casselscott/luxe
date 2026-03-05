import axios from "axios";
import Link from "next/link";
import React, { useEffect, useReducer } from "react";
import Layout from "../components/Layout";
import { getError } from "../utils/error";

// Icons (you can replace with your preferred icon library)
const PaidIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UnpaidIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const DeliveredIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const NotDeliveredIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const DollarIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, orders: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function OrderHistoryScreen() {
  const [{ loading, error, orders }, dispatch] = useReducer(reducer, {
    loading: true,
    orders: [],
    error: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/orders/history`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchOrders();
  }, []);

  return (
    <Layout title="Order History">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page header with animated gradient */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 animate-gradient">
              Order History
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              Track all your past purchases in one place
            </p>
          </div>

          {loading ? (
            // Skeleton loading cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="h-8 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error alert
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md"
              role="alert"
            >
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            // Empty state
            <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">
                No orders yet
              </h3>
              <p className="mt-2 text-gray-500">
                Start shopping to see your order history.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            // Order cards grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order, index) => (
                <div
                  key={order._id}
                  className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-white/20"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Top accent bar with status color */}
                  <div
                    className={`h-1 w-full ${order.isPaid ? "bg-green-500" : "bg-yellow-500"}`}
                  ></div>

                  <div className="p-6">
                    {/* Order ID and short ID */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Order
                        </p>
                        <p className="text-lg font-mono font-bold text-gray-800">
                          #{order._id.substring(18, 24)}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">
                        {order.createdAt.substring(0, 10)}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="space-y-3 mb-6">
                      {/* Date with icon */}
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon />
                        <span className="ml-2">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>

                      {/* Total with icon */}
                      <div className="flex items-center text-sm font-semibold text-gray-800">
                        <DollarIcon />
                        <span className="ml-2">
                          ${order.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Paid status */}
                      <div className="flex items-center text-sm">
                        {order.isPaid ? (
                          <>
                            <span className="text-green-600">
                              <PaidIcon />
                            </span>
                            <span className="ml-2 text-green-700">
                              Paid on{" "}
                              {new Date(order.paidAt).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-500">
                              <UnpaidIcon />
                            </span>
                            <span className="ml-2 text-red-600">Not paid</span>
                          </>
                        )}
                      </div>

                      {/* Delivered status */}
                      <div className="flex items-center text-sm">
                        {order.isDelivered ? (
                          <>
                            <span className="text-green-600">
                              <DeliveredIcon />
                            </span>
                            <span className="ml-2 text-green-700">
                              Delivered on{" "}
                              {new Date(order.deliveredAt).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-orange-500">
                              <NotDeliveredIcon />
                            </span>
                            <span className="ml-2 text-orange-600">
                              Not delivered
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end">
                      <Link href={`/order/${order._id}`} passHref>
                        <button className="relative px-6 py-2 bg-gray-900 text-white rounded-full font-medium overflow-hidden group/btn transition-all duration-300 hover:bg-gray-800 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                          <span className="relative z-10">View Details</span>
                          <span className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .group {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
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
      `}</style>
    </Layout>
  );
}

OrderHistoryScreen.auth = true;
export default OrderHistoryScreen;
