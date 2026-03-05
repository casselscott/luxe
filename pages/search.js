import axios from "axios";
import { useRouter } from "next/router";
import { useContext } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { Store } from "../utils/Store";
import {
  XCircleIcon,
  FilterIcon,
  SortAscendingIcon,
  ViewGridIcon,
  CurrencyDollarIcon,
  StarIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/outline";
import ProductItem from "../components/ProductItem";
import Product from "../models/Product";
import db from "../utils/db";

const PAGE_SIZE = 2;

const prices = [
  { name: "$1 to $50", value: "1-50" },
  { name: "$51 to $200", value: "51-200" },
  { name: "$201 to $1000", value: "201-1000" },
];

const ratings = [1, 2, 3, 4, 5];

export default function Search(props) {
  const router = useRouter();

  const {
    query = "all",
    category = "all",
    brand = "all",
    price = "all",
    rating = "all",
    sort = "featured",
    page = 1,
  } = router.query;

  const { products, countProducts, categories, brands, pages } = props;

  const filterSearch = ({
    page,
    category,
    brand,
    sort,
    min,
    max,
    searchQuery,
    price,
    rating,
  }) => {
    const { query } = router;
    if (page) query.page = page;
    if (searchQuery) query.searchQuery = searchQuery;
    if (sort) query.sort = sort;
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (price) query.price = price;
    if (rating) query.rating = rating;
    if (min) query.min ? query.min : query.min === 0 ? 0 : min;
    if (max) query.max ? query.max : query.max === 0 ? 0 : max;

    router.push({
      pathname: router.pathname,
      query: query,
    });
  };

  const categoryHandler = (e) => {
    filterSearch({ category: e.target.value });
  };
  const pageHandler = (page) => {
    filterSearch({ page });
  };
  const brandHandler = (e) => {
    filterSearch({ brand: e.target.value });
  };
  const sortHandler = (e) => {
    filterSearch({ sort: e.target.value });
  };
  const priceHandler = (e) => {
    filterSearch({ price: e.target.value });
  };
  const ratingHandler = (e) => {
    filterSearch({ rating: e.target.value });
  };

  const { state, dispatch } = useContext(Store);
  const addToCartHandler = async (product) => {
    const existItem = state.cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      toast.error("Sorry. Product is out of stock");
      return;
    }
    dispatch({ type: "CART_ADD_ITEM", payload: { ...product, quantity } });
    router.push("/cart");
  };

  // Helper to display active filters
  const hasActiveFilters =
    (query !== "all" && query !== "") ||
    category !== "all" ||
    brand !== "all" ||
    price !== "all" ||
    rating !== "all";

  return (
    <Layout title="Search">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8 animate-fadeInDown">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              Search Products
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              Find exactly what you're looking for
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1 mb-8 lg:mb-0 animate-slideInLeft">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 sticky top-24">
                <div className="flex items-center mb-6">
                  <FilterIcon className="h-6 w-6 text-gray-700 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Filters
                  </h2>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <TagIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Categories
                    </label>
                  </div>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300"
                    value={category}
                    onChange={categoryHandler}
                  >
                    <option value="all">All</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brands */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <TagIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Brands
                    </label>
                  </div>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300"
                    value={brand}
                    onChange={brandHandler}
                  >
                    <option value="all">All</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                  </div>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300"
                    value={price}
                    onChange={priceHandler}
                  >
                    <option value="all">All</option>
                    {prices.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ratings */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <StarIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Rating
                    </label>
                  </div>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300"
                    value={rating}
                    onChange={ratingHandler}
                  >
                    <option value="all">All</option>
                    {ratings.map((r) => (
                      <option key={r} value={r}>
                        {r} star{r > 1 && "s"} & up
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push("/search")}
                      className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <XCircleIcon className="h-5 w-5 mr-1" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Results Bar */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-4 mb-6 border border-white/20 animate-fadeInUp">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center flex-wrap gap-2">
                    <ViewGridIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      {products.length === 0 ? "No" : countProducts} Results
                    </span>
                    {query !== "all" && query !== "" && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm flex items-center">
                        <span className="mr-1">Query:</span> {query}
                      </span>
                    )}
                    {category !== "all" && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                        {category}
                      </span>
                    )}
                    {brand !== "all" && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                        {brand}
                      </span>
                    )}
                    {price !== "all" && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                        Price {price}
                      </span>
                    )}
                    {rating !== "all" && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                        {rating}★ & up
                      </span>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={() => router.push("/search")}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="flex items-center">
                    <SortAscendingIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <select
                      className="p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 text-sm"
                      value={sort}
                      onChange={sortHandler}
                    >
                      <option value="featured">Featured</option>
                      <option value="lowest">Price: Low to High</option>
                      <option value="highest">Price: High to Low</option>
                      <option value="toprated">Customer Reviews</option>
                      <option value="newest">Newest Arrivals</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {products.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-12 text-center border border-white/20">
                  <ViewGridIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map((product, index) => (
                      <div
                        key={product._id}
                        className="animate-fadeIn"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <ProductItem
                          product={product}
                          addToCartHandler={addToCartHandler}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="flex items-center space-x-2">
                        <button
                          onClick={() => page > 1 && pageHandler(page - 1)}
                          disabled={page <= 1}
                          className={`p-2 rounded-full border ${
                            page <= 1
                              ? "border-gray-200 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          } transition-colors`}
                          aria-label="Previous page"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        {[...Array(pages).keys()].map((pageNumber) => (
                          <button
                            key={pageNumber}
                            onClick={() => pageHandler(pageNumber + 1)}
                            className={`w-10 h-10 rounded-full font-medium transition-all duration-300 ${
                              page == pageNumber + 1
                                ? "bg-gray-900 text-white shadow-md"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            }`}
                          >
                            {pageNumber + 1}
                          </button>
                        ))}

                        <button
                          onClick={() => page < pages && pageHandler(page + 1)}
                          disabled={page >= pages}
                          className={`p-2 rounded-full border ${
                            page >= pages
                              ? "border-gray-200 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          } transition-colors`}
                          aria-label="Next page"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
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
        .animate-fadeIn {
          opacity: 0;
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </Layout>
  );
}

export async function getServerSideProps({ query }) {
  const pageSize = query.pageSize || PAGE_SIZE;
  const page = query.page || 1;
  const category = query.category || "";
  const brand = query.brand || "";
  const price = query.price || "";
  const rating = query.rating || "";
  const sort = query.sort || "";
  const searchQuery = query.query || "";

  const queryFilter =
    searchQuery && searchQuery !== "all"
      ? {
          name: {
            $regex: searchQuery,
            $options: "i",
          },
        }
      : {};
  const categoryFilter = category && category !== "all" ? { category } : {};
  const brandFilter = brand && brand !== "all" ? { brand } : {};
  const ratingFilter =
    rating && rating !== "all"
      ? {
          rating: {
            $gte: Number(rating),
          },
        }
      : {};
  const priceFilter =
    price && price !== "all"
      ? {
          price: {
            $gte: Number(price.split("-")[0]),
            $lte: Number(price.split("-")[1]),
          },
        }
      : {};
  const order =
    sort === "featured"
      ? { isFeatured: -1 }
      : sort === "lowest"
        ? { price: 1 }
        : sort === "highest"
          ? { price: -1 }
          : sort === "toprated"
            ? { rating: -1 }
            : sort === "newest"
              ? { createdAt: -1 }
              : { _id: -1 };

  await db.connect();
  const categories = await Product.find().distinct("category");
  const brands = await Product.find().distinct("brand");
  const productDocs = await Product.find(
    {
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...brandFilter,
      ...ratingFilter,
    },
    "-reviews",
  )
    .sort(order)
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .lean();

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...brandFilter,
    ...ratingFilter,
  });

  await db.disconnect();
  const products = productDocs.map(db.convertDocToObj);

  return {
    props: {
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
      categories,
      brands,
    },
  };
}
