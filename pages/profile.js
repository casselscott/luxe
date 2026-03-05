import React, { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getError } from "../utils/error";
import axios from "axios";
import Layout from "../components/Layout";
import Image from "next/image";

export default function ProfileScreen() {
  const { data: session } = useSession();

  const {
    handleSubmit,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (session?.user) {
      setValue("name", session.user.name);
      setValue("email", session.user.email);
    }
  }, [session, setValue]);

  const submitHandler = async ({ name, email, password }) => {
    try {
      await axios.put("/api/auth/update", {
        name,
        email,
        password,
      });
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      toast.success("Profile updated successfully");
      if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <Layout title="Profile">
      {/* Two-column grid with animations */}
      <div className="grid md:grid-cols-2 h-screen overflow-hidden">
        {/* Left column - image with fade-in and floating animation */}
        <div className="hidden md:block relative h-full animate-fadeIn">
          <div className="absolute inset-0 animate-float">
            <Image
              src="https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707867/image56_vcnaud.jpg"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Optional overlay for depth */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Right column - profile form with slide-in animation */}
        <div className="flex items-center justify-center bg-gray-800 p-8 animate-slideIn">
          <form
            className="max-w-md w-full bg-gray-900 p-8 rounded-lg shadow-2xl transform transition-all duration-500 hover:scale-[1.02]"
            onSubmit={handleSubmit(submitHandler)}
          >
            <h1
              className="text-3xl text-white font-bold text-center mb-6 animate-fadeInUp"
              style={{ animationDelay: "0.1s" }}
            >
              Update Profile
            </h1>

            {/* Name field */}
            <div
              className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              <label htmlFor="name">Name</label>
              <input
                type="text"
                className="w-full text-gray-500 font-bold rounded-lg transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-white/50"
                id="name"
                autoFocus
                {...register("name", {
                  required: "Please enter name",
                })}
              />
              {errors.name && (
                <div className="text-red-500 text-sm mt-1 animate-shake">
                  {errors.name.message}
                </div>
              )}
            </div>

            {/* Email field */}
            <div
              className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
              style={{ animationDelay: "0.3s" }}
            >
              <label htmlFor="email">Email</label>
              <input
                type="email"
                className="w-full text-gray-500 font-bold rounded-lg transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-white/50"
                id="email"
                {...register("email", {
                  required: "Please enter email",
                  pattern: {
                    value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/i,
                    message: "Please enter valid email",
                  },
                })}
              />
              {errors.email && (
                <div className="text-red-500 text-sm mt-1 animate-shake">
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* New Password field */}
            <div
              className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
              style={{ animationDelay: "0.4s" }}
            >
              <label htmlFor="password">New Password</label>
              <input
                className="w-full text-gray-500 font-bold rounded-lg transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-white/50"
                type="password"
                id="password"
                {...register("password", {
                  required: "Please enter new password",
                  minLength: {
                    value: 6,
                    message: "password is more than 5 chars",
                  },
                })}
              />
              {errors.password && (
                <div className="text-red-500 text-sm mt-1 animate-shake">
                  {errors.password.message}
                </div>
              )}
            </div>

            {/* Confirm Password field */}
            <div
              className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
              style={{ animationDelay: "0.5s" }}
            >
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                className="w-full text-gray-500 font-bold rounded-lg transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-white/50"
                type="password"
                id="confirmPassword"
                {...register("confirmPassword", {
                  required: "Please confirm new password",
                  validate: (value) => value === getValues("password"),
                  minLength: {
                    value: 6,
                    message: "confirm password is more than 5 chars",
                  },
                })}
              />
              {errors.confirmPassword && (
                <div className="text-red-500 text-sm mt-1 animate-shake">
                  {errors.confirmPassword.message}
                </div>
              )}
              {errors.confirmPassword &&
                errors.confirmPassword.type === "validate" && (
                  <div className="text-red-500 text-sm mt-1 animate-shake">
                    Passwords do not match
                  </div>
                )}
            </div>

            {/* Update button */}
            <div
              className="flex flex-col text-white font-bold py-2 animate-fadeInUp"
              style={{ animationDelay: "0.6s" }}
            >
              <button className="w-full bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Update Profile
              </button>
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

ProfileScreen.auth = true;
