import Link from "next/link";
import { useForm } from "react-hook-form";
import Layout from "../components/Layout";
import React, { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { getError } from "../utils/error";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import Image from "next/image";

export default function LoginScreen() {
  const { data: session } = useSession();
  const router = useRouter();
  const { redirect } = router.query;

  useEffect(() => {
    if (session?.user) {
      router.push(redirect || "/");
    }
  }, [router, session, redirect]);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const submitHandler = async ({ email, password }) => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <Layout title="login">
      {/* Two-column grid with animations */}
      <div className="grid md:grid-cols-2 h-screen overflow-hidden">
        {/* Left column - image with fade-in and floating animation */}
        <div className="hidden md:block relative h-full animate-fadeIn">
          <div className="absolute inset-0 animate-float">
            <Image
              src="https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707859/image55_hqlwgs.jpg"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Optional overlay for depth */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Right column - login form with slide-in animation */}
        <div className="flex items-center justify-center bg-gray-800 p-8 animate-slideIn">
          <form
            className="max-w-md w-full bg-gray-900 p-8 rounded-lg shadow-2xl transform transition-all duration-500 hover:scale-[1.02]"
            onSubmit={handleSubmit(submitHandler)}
          >
            <div className="w-full">
              {/* Brand with fade-in */}
              <div
                className="flex flex-col justify-center animate-fadeInUp"
                style={{ animationDelay: "0.1s" }}
              >
                <p className="text-3xl text-white font-bold text-center">
                  FASHION HOUSE
                </p>
              </div>

              {/* Divider with animation */}
              <div
                className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300 animate-fadeInUp"
                style={{ animationDelay: "0.2s" }}
              >
                <p className="mx-4 mb-0 text-center text-white font-bold">
                  Login
                </p>
              </div>

              {/* Email field */}
              <div
                className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
                style={{ animationDelay: "0.3s" }}
              >
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Please enter email",
                    pattern: {
                      value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/i,
                      message: "Please enter valid email",
                    },
                  })}
                  className="rounded-lg text-gray-500 font-bold transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-white/50"
                  id="email"
                  autoFocus
                />
                {errors.email && (
                  <div className="text-red-500 text-sm mt-1 animate-shake">
                    {errors.email.message}
                  </div>
                )}
              </div>

              {/* Password field */}
              <div
                className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
                style={{ animationDelay: "0.4s" }}
              >
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  {...register("password", {
                    required: "Please enter password",
                    minLength: {
                      value: 6,
                      message: "password is more than 5 chars",
                    },
                  })}
                  className="rounded-lg text-gray-500 font-bold transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-white/50"
                  id="password"
                />
                {errors.password && (
                  <div className="text-red-500 text-sm mt-1 animate-shake">
                    {errors.password.message}
                  </div>
                )}

                {/* Remember me checkbox */}
                <div className="mb-[0.125rem] block min-h-[1.5rem] pl-[1.5rem] mt-2">
                  <input
                    className="relative float-left -ml-[1.5rem] mr-[6px] mt-[0.15rem] h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-neutral-300 outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
                    type="checkbox"
                    id="remember"
                  />
                  <label
                    className="inline-block pl-[0.15rem] hover:cursor-pointer text-white"
                    htmlFor="remember"
                  >
                    Remember me
                  </label>
                </div>
              </div>

              {/* Login button with glow effect */}
              <div
                className="flex-col text-gray-700 py-2 animate-fadeInUp"
                style={{ animationDelay: "0.5s" }}
              >
                <button className="w-full bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Login
                </button>
              </div>

              {/* Register link */}
              <div
                className="flex-col text-white font-bold py-2 animate-fadeInUp"
                style={{ animationDelay: "0.6s" }}
              >
                Don&apos;t have an account? &nbsp;
                <Link
                  href={`/register?redirect=${redirect || "/"}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-300 hover:underline"
                >
                  Register
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
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
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.8s ease-out;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </Layout>
  );
}
