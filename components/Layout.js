import Head from "next/head";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { Store } from "../utils/Store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signOut, useSession } from "next-auth/react";
import Cookies from "js-cookie";
import { Menu } from "@headlessui/react";
import DropdownLink from "./DropdownLink";
import Image from "next/image";
import { useRouter } from "next/router";
import { SearchIcon } from "@heroicons/react/outline";
import FashionFooter from "./FashionFooter";

export default function Layout({ title, children, noFooter }) {
  const { status, data: session } = useSession();
  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setCartItemsCount(cart.cartItems.reduce((a, c) => a + c.quantity, 0));
  }, [cart.cartItems]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoutClickHandler = () => {
    Cookies.remove("cart");
    dispatch({ type: "CART_RESET" });
    signOut({ callbackUrl: "/login" });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    router.push(`/search?query=${query}`);
  };

  return (
    <>
      <Head>
        <title>{title ? title + " - Fashion House" : "Fashion House"}</title>
        <meta name="description" content="Ecommerce Website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToastContainer position="bottom-center" limit={1} />

      <div className="flex min-h-screen flex-col justify-between">
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
              ? "bg-gray-900/90 backdrop-blur-md shadow-lg"
              : "bg-gray-900"
          }`}
        >
          <nav className="flex h-16 items-center px-6 md:px-8 justify-between text-white font-medium">
            {/* Logo */}
            <Link href="/" legacyBehavior>
              <a className="flex items-center group whitespace-nowrap">
                <Image
                  src="/images/logo.jpg"
                  alt="logo"
                  width={45}
                  height={40}
                  className="rounded-full transition-transform group-hover:scale-110"
                />
                <span className="ml-3 text-xl font-bold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  FASHION HOUSE
                </span>
              </a>
            </Link>

            {/* Desktop Search */}
            <div className="flex-1 max-w-xs mx-auto hidden md:block">
              <form onSubmit={submitHandler}>
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="text"
                    placeholder="Search for elegance..."
                    className="w-full py-2 pl-5 pr-10 text-sm
                      bg-white/10 backdrop-blur-sm
                      border border-gray-700 rounded-full
                      text-white placeholder:text-gray-400
                      focus:outline-none focus:ring-1 focus:ring-white/30"
                  />

                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      p-1 rounded-full
                      text-white/70 hover:text-white
                      transition-colors"
                  >
                    <SearchIcon className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-6">
              <Link href="/cart" legacyBehavior>
                <a className="relative p-2 group">
                  <svg
                    className="h-6 w-6 text-white/80 group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold animate-pulse">
                      {cartItemsCount}
                    </span>
                  )}
                </a>
              </Link>

              {status === "loading" ? (
                <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
              ) : session?.user ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2">
                    <span className="hidden sm:inline">
                      {session.user.name.split(" ")[0]}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                      {session.user.name.charAt(0)}
                    </div>
                  </Menu.Button>

                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-xl divide-y divide-gray-700">
                    <DropdownLink href="/profile">Profile</DropdownLink>
                    <DropdownLink href="/order-history">
                      Order History
                    </DropdownLink>
                    {session.user.isAdmin && (
                      <DropdownLink href="/admin/dashboard">
                        Admin Dashboard
                      </DropdownLink>
                    )}
                    <button
                      onClick={logoutClickHandler}
                      className="block w-full text-left px-4 py-4 text-gray-200 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </Menu.Items>
                </Menu>
              ) : (
                <Link href="/login" legacyBehavior>
                  <a className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10">
                    Login
                  </a>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Search */}
          <div className="md:hidden px-4 pb-3">
            <form onSubmit={submitHandler}>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search..."
                  className="w-full py-2 pl-4 pr-10 text-sm
                    bg-white/10 backdrop-blur-sm
                    border border-gray-700 rounded-full
                    text-white placeholder:text-gray-400"
                />

                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    p-1 text-white/70 hover:text-white"
                >
                  <SearchIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </header>

        <main className="container mx-auto mt-4 px-4 flex-1">{children}</main>

        {/* noFooter prop hides footer — used on full-screen pages like /unauthorized */}
        {!noFooter && <FashionFooter />}
      </div>
    </>
  );
}
