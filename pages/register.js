import Link from 'next/link';
import React, { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import { getError } from '../utils/error';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';

export default function LoginScreen() {
  const { data: session } = useSession();

  const router = useRouter();
  const { redirect } = router.query;

  useEffect(() => {
    if (session?.user) {
      router.push(redirect || '/');
    }
  }, [router, session, redirect]);

  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors },
  } = useForm();
  const submitHandler = async ({ name, email, password }) => {
    try {
      await axios.post('/api/auth/signup', {
        name,
        email,
        password,
      });

      const result = await signIn('credentials', {
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
    <Layout title="Create Account">
      <div className="grid grid-cols-1 sm:grid-cols-2 h-screen w-full">
        <div className="hidden sm:block">
          <Image
            className="w-full h-full object-cover m-0 p-0"
            src="/images/image37.jpg"
            alt="image"
          />
        </div>

        <form
          className=" max-w-[500px] justify-center object-cover h-full w-full mx-auto bg-gray-900 p-8 px-8 rounded-lg "
          onSubmit={handleSubmit(submitHandler)}
        >
          <h1 className="mb-4 text-xl text-white font-bold">Create Account</h1>
          <div className="mb-4 text-white font-bold ">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              className="w-full  text-gray-500 font-bold"
              id="name"
              autoFocus
              {...register('name', {
                required: 'Please enter name',
              })}
            />
            {errors.name && (
              <div className="text-red-500">{errors.name.message}</div>
            )}
          </div>

          <div className="mb-4 text-white font-bold">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Please enter email',
                pattern: {
                  value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/i,
                  message: 'Please enter valid email',
                },
              })}
              className="w-full  text-gray-500 font-bold"
              id="email"
            ></input>
            {errors.email && (
              <div className="text-red-500">{errors.email.message}</div>
            )}
          </div>
          <div className="mb-4 text-white font-bold">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Please enter password',
                minLength: {
                  value: 6,
                  message: 'password is more than 5 chars',
                },
              })}
              className="w-full  text-gray-500 font-bold"
              id="password"
              autoFocus
            ></input>
            {errors.password && (
              <div className="text-red-500 ">{errors.password.message}</div>
            )}
          </div>
          <div className="mb-4 text-white font-bold">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              className="w-full  text-gray-500 font-bold"
              type="password"
              id="confirmPassword"
              {...register('confirmPassword', {
                required: 'Please enter confirm password',
                validate: (value) => value === getValues('password'),
                minLength: {
                  value: 6,
                  message: 'confirm password is more than 5 chars',
                },
              })}
            />
            {errors.confirmPassword && (
              <div className="text-red-500 ">
                {errors.confirmPassword.message}
              </div>
            )}
            {errors.confirmPassword &&
              errors.confirmPassword.type === 'validate' && (
                <div className="text-red-500 ">Password do not match</div>
              )}
          </div>

          <div className="mb-4  text-white font-bold">
            <button className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full">
              Register
            </button>
          </div>
          <div
            className="mb-4 text-white font-bold
"
          >
            Already have an account ? &nbsp;
            <Link
              href={`/login?redirect=${redirect || '/'}`}
              className="text-blue-500 hover:text-blue-700"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
