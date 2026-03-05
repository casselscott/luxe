import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaTachometerAlt,
  FaShoppingBag,
  FaBoxes,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaEye,
} from "react-icons/fa";
import React, { useEffect, useReducer } from "react";
import Layout from "../../components/Layout";
import { getError } from "../../utils/error";

// Reducer (unchanged)
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

export default function AdminOrderScreen() {
  const [{ loading, error, orders }, dispatch] = useReducer(reducer, {
    loading: true,
    orders: [],
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/admin/orders`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, []);

  // Helper to render status with icon and color
  const renderStatus = (
    condition,
    date,
    trueLabel,
    falseLabel,
    trueIcon,
    falseIcon,
  ) => {
    if (condition) {
      return (
        <span className="flex items-center space-x-2 text-green-600">
          {trueIcon}
          <span>{date.substring(0, 10)}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-2 text-red-500">
        {falseIcon}
        <span>{falseLabel}</span>
      </span>
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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

  const sidebarVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300 },
    },
  };

  return (
    <Layout title="Admin Orders">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Sidebar – Simple List with Icons (neutral) */}
          <motion.aside
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <ul className="space-y-3">
                {[
                  {
                    href: "/admin/dashboard",
                    icon: FaTachometerAlt,
                    label: "Dashboard",
                    color: "text-indigo-500",
                  },
                  {
                    href: "/admin/orders",
                    icon: FaShoppingBag,
                    label: "Orders",
                    color: "text-amber-500",
                    active: true,
                  },
                  {
                    href: "/admin/products",
                    icon: FaBoxes,
                    label: "Products",
                    color: "text-green-500",
                  },
                  {
                    href: "/admin/users",
                    icon: FaUsers,
                    label: "Users",
                    color: "text-purple-500",
                  },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} legacyBehavior>
                      <a
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                          item.active
                            ? "bg-gray-100 dark:bg-gray-700 font-semibold"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <item.icon className={item.color} />
                        <span className="text-gray-900 dark:text-white">
                          {item.label}
                        </span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Page Title – plain black */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-extrabold mb-8 text-gray-900 dark:text-white"
            >
              Order Management
            </motion.h1>

            {/* Orders Table */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6"
            >
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-black dark:border-white border-solid"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-xl">
                  {error}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-8 py-5">Order ID</th>
                        <th className="px-8 py-5">Customer</th>
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Total</th>
                        <th className="px-8 py-5">Payment</th>
                        <th className="px-8 py-5">Delivery</th>
                        <th className="px-8 py-5">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <motion.tr
                          key={order._id}
                          variants={itemVariants}
                          custom={index}
                          whileHover={{
                            scale: 1.01,
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)",
                            backgroundColor: "rgba(255,255,255,0.95)",
                            transition: { duration: 0.2 },
                          }}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700/50 cursor-default transition-colors"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {/* Order ID */}
                          <td className="px-8 py-5 font-mono font-medium text-gray-500 tracking-wider">
                            #{order._id.substring(0, 12)}...
                          </td>

                          {/* Customer with avatar */}
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                                {order.user?.name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {order.user?.name || "Deleted User"}
                              </span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-8 py-5 text-gray-700 dark:text-gray-300">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>

                          {/* Total */}
                          <td className="px-8 py-5 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            ${order.totalPrice?.toFixed(2)}
                          </td>

                          {/* Payment Status */}
                          <td className="px-8 py-5">
                            {renderStatus(
                              order.isPaid,
                              order.paidAt,
                              "Paid",
                              "Unpaid",
                              <FaCheckCircle className="text-green-500 text-base" />,
                              <FaTimesCircle className="text-red-500 text-base" />,
                            )}
                          </td>

                          {/* Delivery Status */}
                          <td className="px-8 py-5">
                            {renderStatus(
                              order.isDelivered,
                              order.deliveredAt,
                              "Delivered",
                              "Pending",
                              <FaCheckCircle className="text-green-500 text-base" />,
                              <FaTruck className="text-yellow-500 text-base" />,
                            )}
                          </td>

                          {/* Action – black pill button (matches your app colors) */}
                          <td className="px-8 py-5">
                            <Link href={`/order/${order._id}`} passHref>
                              <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-flex items-center px-4 py-1.5 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg transition-colors text-sm font-medium whitespace-nowrap"
                              >
                                <FaEye className="mr-1.5" />
                                View
                              </motion.a>
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {orders.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No orders found.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

AdminOrderScreen.auth = { adminOnly: true };
