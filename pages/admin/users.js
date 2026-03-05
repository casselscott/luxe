import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaTachometerAlt,
  FaShoppingBag,
  FaBoxes,
  FaUsers,
  FaEnvelope,
  FaShieldAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import React, { useEffect, useReducer } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { getError } from "../../utils/error";

// Reducer (unchanged)
function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, users: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "DELETE_REQUEST":
      return { ...state, loadingDelete: true };
    case "DELETE_SUCCESS":
      return { ...state, loadingDelete: false, successDelete: true };
    case "DELETE_FAIL":
      return { ...state, loadingDelete: false };
    case "DELETE_RESET":
      return { ...state, loadingDelete: false, successDelete: false };
    default:
      return state;
  }
}

export default function AdminUsersScreen() {
  const [{ loading, error, users, successDelete, loadingDelete }, dispatch] =
    useReducer(reducer, {
      loading: true,
      users: [],
      error: "",
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/admin/users`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [successDelete]);

  const deleteHandler = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    try {
      dispatch({ type: "DELETE_REQUEST" });
      await axios.delete(`/api/admin/users/${userId}`);
      dispatch({ type: "DELETE_SUCCESS" });
      toast.success("User deleted successfully");
    } catch (err) {
      dispatch({ type: "DELETE_FAIL" });
      toast.error(getError(err));
    }
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
    <Layout title="Admin Users">
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
                    active: true,
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
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-extrabold text-gray-900 dark:text-white"
              >
                User Management
              </motion.h1>
            </div>

            {/* Delete loading indicator */}
            {loadingDelete && (
              <motion.div
                variants={itemVariants}
                className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-xl flex items-center"
              >
                <div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full mr-2" />
                Deleting user...
              </motion.div>
            )}

            {/* Users Table */}
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
                        <th className="px-8 py-5">ID</th>
                        <th className="px-8 py-5">User</th>
                        <th className="px-8 py-5">Email</th>
                        <th className="px-8 py-5">Admin</th>
                        <th className="px-8 py-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <motion.tr
                          key={user._id}
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
                          {/* ID – longer, monospace, spaced out */}
                          <td className="px-8 py-5 font-mono font-medium text-gray-500 tracking-wider">
                            #{user._id.substring(0, 12)}...
                          </td>

                          {/* User with avatar icon */}
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shadow">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-8 py-5 text-gray-700 dark:text-gray-300">
                            <span className="flex items-center space-x-2">
                              <FaEnvelope className="text-gray-500" />
                              <span>{user.email}</span>
                            </span>
                          </td>

                          {/* Admin status with icon */}
                          <td className="px-8 py-5">
                            <span className="flex items-center space-x-2">
                              <FaShieldAlt
                                className={
                                  user.isAdmin
                                    ? "text-purple-500"
                                    : "text-gray-400"
                                }
                              />
                              <span
                                className={
                                  user.isAdmin
                                    ? "text-purple-600 font-semibold"
                                    : "text-gray-600"
                                }
                              >
                                {user.isAdmin ? "YES" : "NO"}
                              </span>
                            </span>
                          </td>

                          {/* Actions – horizontal pills */}
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              <Link href={`/admin/user/${user._id}`} passHref>
                                <motion.a
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="inline-flex items-center px-4 py-1.5 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg transition-colors text-sm font-medium whitespace-nowrap"
                                >
                                  <FaEdit className="mr-1.5" />
                                  Edit
                                </motion.a>
                              </Link>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => deleteHandler(user._id)}
                                className="inline-flex items-center px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors text-sm font-medium whitespace-nowrap"
                              >
                                <FaTrash className="mr-1.5" />
                                Delete
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No users found.
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

AdminUsersScreen.auth = { adminOnly: true };
