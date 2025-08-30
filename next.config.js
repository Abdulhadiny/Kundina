// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // disabled in dev
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ✅ New turbopack config (optional, only if you add loaders later)
  turbopack: {
    rules: {
      // Example: add custom loaders if you ever need them
      // "*.mdx": ["mdx-loader"],
    },
  },
};

module.exports = withPWA(nextConfig);
