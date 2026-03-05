import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { FaDollarSign, FaShoppingBag, FaBoxes, FaUsers } from "react-icons/fa";
import React, { useEffect, useReducer } from "react";
import Layout from "../../components/Layout";
import { getError } from "../../utils/error";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// ---------------- REDUCER (preserves default sample data) ----------------
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        summary: {
          ...state.summary, // keep defaults (like categorySales)
          ...action.payload, // override with API data
        },
        error: "",
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const AdminDashboardScreen = () => {
  const [{ loading, error, summary }, dispatch] = useReducer(reducer, {
    loading: true,
    summary: {
      ordersPrice: 0,
      ordersCount: 0,
      productsCount: 0,
      usersCount: 0,
      salesData: [],
      // Sample category sales – will be used until API provides real data
      categorySales: [
        { category: "Clothing", sales: 12450 },
        { category: "Accessories", sales: 8320 },
        { category: "Footwear", sales: 6890 },
        { category: "Bags", sales: 4520 },
        { category: "Jewelry", sales: 2980 },
      ],
    },
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/admin/summary`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, []);

  // ---------------- SAFE DATA ACCESS ----------------
  const categorySales = summary.categorySales ?? [];

  // ---------- Line chart (monthly sales) ----------
  const lineData = {
    labels: summary.salesData?.map((x) => x._id) || [],
    datasets: [
      {
        label: "Monthly Sales ($)",
        data: summary.salesData?.map((x) => x.totalSales) || [],
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // ---------- Horizontal bar chart (sales by category) ----------
  const horizontalBarData = {
    labels: categorySales.map((x) => x.category),
    datasets: [
      {
        label: "Sales by Category ($)",
        data: categorySales.map((x) => x.sales),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 1,
      },
    ],
  };

  const horizontalBarOptions = {
    indexAxis: "y", // horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  // ---------- Doughnut chart (category distribution) ----------
  const doughnutData = {
    labels: categorySales.map((x) => x.category),
    datasets: [
      {
        data: categorySales.map((x) => x.sales),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  // ---------------- Animation variants ----------------
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  // ---------------- UI ----------------
  return (
    <Layout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
        >
          <ul className="space-y-2">
            <li>
              <Link href="/admin/dashboard" legacyBehavior>
                <a className="flex items-center p-3 rounded-lg bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 font-semibold">
                  <FaDollarSign className="mr-3" /> Dashboard
                </a>
              </Link>
            </li>
            <li>
              <Link href="/admin/orders" legacyBehavior>
                <a className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <FaShoppingBag className="mr-3" /> Orders
                </a>
              </Link>
            </li>
            <li>
              <Link href="/admin/products" legacyBehavior>
                <a className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <FaBoxes className="mr-3" /> Products
                </a>
              </Link>
            </li>
            <li>
              <Link href="/admin/users" legacyBehavior>
                <a className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <FaUsers className="mr-3" /> Users
                </a>
              </Link>
            </li>
          </ul>
        </motion.div>

        {/* Main content */}
        <div className="md:col-span-3 space-y-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Sales",
                    value: `$${summary.ordersPrice?.toFixed(2) || 0}`,
                    icon: <FaDollarSign className="text-3xl text-white" />,
                    color: "from-indigo-500 to-indigo-600",
                    link: "/admin/orders",
                  },
                  {
                    title: "Orders",
                    value: summary.ordersCount || 0,
                    icon: <FaShoppingBag className="text-3xl text-white" />,
                    color: "from-amber-500 to-amber-600",
                    link: "/admin/orders",
                  },
                  {
                    title: "Products",
                    value: summary.productsCount || 0,
                    icon: <FaBoxes className="text-3xl text-white" />,
                    color: "from-green-500 to-green-600",
                    link: "/admin/products",
                  },
                  {
                    title: "Users",
                    value: summary.usersCount || 0,
                    icon: <FaUsers className="text-3xl text-white" />,
                    color: "from-purple-500 to-purple-600",
                    link: "/admin/users",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <Link href={item.link} legacyBehavior>
                      <a className="block">
                        <div
                          className="absolute inset-0 bg-gradient-to-r opacity-75 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10"
                          style={{
                            background: `linear-gradient(to right, ${
                              item.color.split(" ")[1]
                            }, ${item.color.split(" ")[3]})`,
                          }}
                        />
                        <div
                          className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-white shadow-lg transform group-hover:scale-105 transition-transform`}
                          style={{
                            transformStyle: "preserve-3d",
                            perspective: "500px",
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm opacity-90">{item.title}</p>
                              <p className="text-2xl font-bold">{item.value}</p>
                            </div>
                            <div
                              className="bg-white/20 p-3 rounded-full transform rotate-12 group-hover:rotate-0 transition-transform duration-300"
                              style={{ transform: "translateZ(20px)" }}
                            >
                              {item.icon}
                            </div>
                          </div>
                          <div className="mt-4 text-xs underline">
                            View details →
                          </div>
                        </div>
                      </a>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <motion.div
                  variants={chartVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg"
                >
                  <h2 className="text-lg font-semibold mb-4">
                    Monthly Sales Trend
                  </h2>
                  <div className="h-64">
                    <Line
                      data={lineData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </motion.div>

                {/* Horizontal Bar Chart */}
                <motion.div
                  variants={chartVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg"
                >
                  <h2 className="text-lg font-semibold mb-4">
                    Sales by Category
                  </h2>
                  <div className="h-64">
                    <Bar
                      data={horizontalBarData}
                      options={horizontalBarOptions}
                    />
                  </div>
                </motion.div>

                {/* Doughnut Chart */}
                <motion.div
                  variants={chartVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg lg:col-span-2"
                >
                  <h2 className="text-lg font-semibold mb-4">
                    Category Sales Distribution
                  </h2>
                  <div className="h-64 flex justify-center">
                    <div className="w-80">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

AdminDashboardScreen.auth = { adminOnly: true };
export default AdminDashboardScreen;
