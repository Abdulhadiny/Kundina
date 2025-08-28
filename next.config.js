// next.config.js

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Remove this line – it's deprecated with Turbo engine
  // swcMinify: true, 

  experimental: {
    // Turbo should be an object or false (not a boolean true/false alone)
    turbo: {
      loaders: {
        '.js': ['babel'],
        '.ts': ['babel'],
        '.tsx': ['babel'],
      },
    },
  },
};

module.exports = withPWA(nextConfig);
