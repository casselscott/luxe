import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaTachometerAlt,
  FaShoppingBag,
  FaBoxes,
  FaUsers,
  FaStar,
  FaCube,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import React, { useEffect, useReducer } from "react";
import Layout from "../../components/Layout";
import { getError } from "../../utils/error";
import { toast } from "react-toastify";

// Reducer (unchanged)
function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, products: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreate: true };
    case "CREATE_SUCCESS":
      return { ...state, loadingCreate: false };
    case "CREATE_FAIL":
      return { ...state, loadingCreate: false };
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

export default function AdminProductsScreen() {
  const router = useRouter();
  const [
    { loading, error, products, loadingCreate, successDelete, loadingDelete },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    products: [],
    error: "",
  });

  // Create product
  const createHandler = async () => {
    if (!window.confirm("Are you sure you want to create a new product?")) {
      return;
    }
    try {
      dispatch({ type: "CREATE_REQUEST" });
      const { data } = await axios.post(`/api/admin/products`);
      dispatch({ type: "CREATE_SUCCESS" });
      toast.success("Product created successfully");
      router.push(`/admin/product/${data.product._id}`);
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(err));
    }
  };

  // Delete product
  const deleteHandler = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      dispatch({ type: "DELETE_REQUEST" });
      await axios.delete(`/api/admin/products/${productId}`);
      dispatch({ type: "DELETE_SUCCESS" });
      toast.success("Product deleted successfully");
    } catch (err) {
      dispatch({ type: "DELETE_FAIL" });
      toast.error(getError(err));
    }
  };

  // Fetch products (runs on mount and after successful delete)
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/admin/products`);
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

  // Helper to render star rating – larger stars with more spacing
  const renderRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`text-lg ${
            i <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
          }`}
        />,
      );
    }
    return <div className="flex space-x-1">{stars}</div>;
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
    <Layout title="Admin Products">
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
                    active: true,
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
            {/* Header with Create Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-extrabold text-gray-900 dark:text-white"
              >
                Product Catalog
              </motion.h1>

              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createHandler}
                  disabled={loadingCreate}
                  className="inline-flex items-center px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCreate ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Create Product
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>

            {/* Delete loading indicator */}
            {loadingDelete && (
              <motion.div
                variants={itemVariants}
                className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-xl flex items-center"
              >
                <div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full mr-2" />
                Deleting product...
              </motion.div>
            )}

            {/* Products Table */}
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
                        <th className="px-8 py-5">Product</th>
                        <th className="px-8 py-5 text-right">Price</th>
                        <th className="px-8 py-5">Category</th>
                        <th className="px-8 py-5">Stock</th>
                        <th className="px-8 py-5">Rating</th>
                        <th className="px-8 py-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <motion.tr
                          key={product._id}
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
                            #{product._id.substring(0, 12)}...
                          </td>

                          {/* Product with larger thumbnail */}
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover shadow"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                  {product.name?.charAt(0)}
                                </div>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </span>
                            </div>
                          </td>

                          {/* Price – right-aligned, no wrapping */}
                          <td className="px-8 py-5 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            ${product.price?.toFixed(2)}
                          </td>

                          {/* Category */}
                          <td className="px-8 py-5 text-gray-700 dark:text-gray-300">
                            {product.category}
                          </td>

                          {/* Stock with icon */}
                          <td className="px-8 py-5">
                            <span className="flex items-center space-x-2">
                              <FaCube className="text-gray-500" />
                              <span
                                className={
                                  product.countInStock > 0
                                    ? "text-green-600 font-medium"
                                    : "text-red-500 font-medium"
                                }
                              >
                                {product.countInStock}
                              </span>
                            </span>
                          </td>

                          {/* Rating – larger stars, more spacing */}
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              {renderRating(product.rating)}
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                ({product.numReviews || 0})
                              </span>
                            </div>
                          </td>

                          {/* Actions – horizontal pills with extra spacing */}
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              <Link
                                href={`/admin/product/${product._id}`}
                                passHref
                              >
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
                                onClick={() => deleteHandler(product._id)}
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

                  {products.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No products found. Click "Create Product" to add one.
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

AdminProductsScreen.auth = { adminOnly: true };
