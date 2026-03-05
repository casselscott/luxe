import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useReducer } from "react";
import Layout from "../../components/Layout";
import { getError } from "../../utils/error";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  LocationMarkerIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ReceiptTaxIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ClockIcon,
} from "@heroicons/react/outline";

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, order: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "PAY_REQUEST":
      return { ...state, loadingPay: true };
    case "PAY_SUCCESS":
      return { ...state, loadingPay: false, successPay: true };
    case "PAY_FAIL":
      return { ...state, loadingPay: false, errorPay: action.payload };
    case "PAY_RESET":
      return { ...state, loadingPay: false, successPay: false, errorPay: "" };
    case "DELIVER_REQUEST":
      return { ...state, loadingDeliver: true };
    case "DELIVER_SUCCESS":
      return { ...state, loadingDeliver: false, successDeliver: true };
    case "DELIVER_FAIL":
      return { ...state, loadingDeliver: false };
    case "DELIVER_RESET":
      return {
        ...state,
        loadingDeliver: false,
        successDeliver: false,
      };
    default:
      return state;
  }
}

function OrderScreen() {
  const { data: session } = useSession();
  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();
  const { query } = useRouter();
  const orderId = query.id;

  const [
    {
      loading,
      error,
      order,
      successPay,
      loadingPay,
      loadingDeliver,
      successDeliver,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    order: {},
    error: "",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/orders/${orderId}`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    if (
      !order._id ||
      successPay ||
      successDeliver ||
      (order._id && order._id !== orderId)
    ) {
      fetchOrder();
      if (successPay) {
        dispatch({ type: "PAY_RESET" });
      }
      if (successDeliver) {
        dispatch({ type: "DELIVER_RESET" });
      }
    } else {
      const loadPaypalScript = async () => {
        const { data: clientId } = await axios.get("/api/keys/paypal");
        paypalDispatch({
          type: "resetOptions",
          value: {
            "client-id": clientId,
            currency: "CAD",
          },
        });
        paypalDispatch({ type: "setLoadingStatus", value: "pending" });
      };
      loadPaypalScript();
    }
  }, [order, orderId, paypalDispatch, successDeliver, successPay]);

  const {
    shippingAddress,
    paymentMethod,
    orderItems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
  } = order;

  function createOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { value: totalPrice },
          },
        ],
      })
      .then((orderID) => {
        return orderID;
      });
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        dispatch({ type: "PAY_REQUEST" });
        const { data } = await axios.put(
          `/api/orders/${order._id}/pay`,
          details,
        );
        dispatch({ type: "PAY_SUCCESS", payload: data });
        toast.success("Order is paid successfully");
      } catch (err) {
        dispatch({ type: "PAY_FAIL", payload: getError(err) });
        toast.error(getError(err));
      }
    });
  }

  function onError(err) {
    toast.error(getError(err));
  }

  async function deliverOrderHandler() {
    try {
      dispatch({ type: "DELIVER_REQUEST" });
      const { data } = await axios.put(
        `/api/admin/orders/${order._id}/deliver`,
        {},
      );
      dispatch({ type: "DELIVER_SUCCESS", payload: data });
      toast.success("Order is delivered");
    } catch (err) {
      dispatch({ type: "DELIVER_FAIL", payload: getError(err) });
      toast.error(getError(err));
    }
  }

  return (
    <Layout title={`Order ${orderId}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-10 animate-fadeInDown">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              Order #{orderId}
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              Track your order status and details
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Left Column - Shipping, Payment, Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 animate-slideInLeft">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <LocationMarkerIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Shipping Address
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {shippingAddress.fullName}, {shippingAddress.address},{" "}
                        {shippingAddress.city}, {shippingAddress.postalCode},{" "}
                        {shippingAddress.country}
                      </p>
                      <div className="mt-2">
                        {isDelivered ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Delivered on{" "}
                            {new Date(deliveredAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Not delivered
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Card */}
                <div
                  className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 animate-slideInLeft"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <CreditCardIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Payment Method
                      </h2>
                      <p className="text-gray-600 mt-1">{paymentMethod}</p>
                      <div className="mt-2">
                        {isPaid ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Paid on {new Date(paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Not paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items Card */}
                <div
                  className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 animate-slideInLeft"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                      <ShoppingBagIcon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Order Items
                    </h2>
                  </div>

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
                        {orderItems.map((item, index) => (
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
                        ${itemsPrice?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-medium text-gray-800">
                        {shippingPrice === 0
                          ? "Free"
                          : `$${shippingPrice?.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span className="font-medium text-gray-800">
                        ${taxPrice?.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total</span>
                        <span>${totalPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* PayPal Buttons */}
                  {!isPaid && (
                    <div className="mt-6">
                      {isPending ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                      ) : (
                        <PayPalButtons
                          createOrder={createOrder}
                          onApprove={onApprove}
                          onError={onError}
                          style={{ layout: "vertical" }}
                        />
                      )}
                      {loadingPay && (
                        <div className="text-center mt-2 text-gray-600">
                          Processing payment...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Deliver Button */}
                  {session?.user?.isAdmin &&
                    order.isPaid &&
                    !order.isDelivered && (
                      <div className="mt-6">
                        <button
                          onClick={deliverOrderHandler}
                          disabled={loadingDeliver}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {loadingDeliver ? (
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
                              <TruckIcon className="h-5 w-5 mr-2" />
                              Mark as Delivered
                            </>
                          )}
                        </button>
                      </div>
                    )}

                  {/* Order Status Message */}
                  {isPaid && isDelivered && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-700 text-sm text-center">
                      <CheckCircleIcon className="h-5 w-5 inline mr-1" />
                      Order completed successfully
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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

OrderScreen.auth = true;
export default OrderScreen;
