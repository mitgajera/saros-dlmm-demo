
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable typedRoutes to avoid Link href type errors with string paths
  experimental: {}
};
module.exports = nextConfig;
