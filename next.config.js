/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ["res.cloudinary.com"],
  },
};
module.exports = nextConfig;
