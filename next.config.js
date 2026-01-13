/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable Turbopack (Next.js 16+)
  turbopack: {},
  
  // Enable API routes
  async rewrites() {
    return [];
  },
  
  // Environment variables accessible on the client
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },

  // Image configuration for album arts
  images: {
    domains: ['i.ytimg.com', 'img.youtube.com'],
    unoptimized: true
  }
};

module.exports = nextConfig;

