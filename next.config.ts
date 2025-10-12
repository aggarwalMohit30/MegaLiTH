import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // For images or fetches from external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "larksome-nell-lustrelessly.ngrok-free.dev",
      },
    ],
  },

  // Fix CORS and authorization issues on Vercel
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },

  // Rewrites for ngrok OAuth and API routes (only in development)
  async rewrites() {
    // Only use ngrok rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: "/api/:path*",
          destination: `https://larksome-nell-lustrelessly.ngrok-free.dev/api/:path*`,
        },
      ];
    }
    // No rewrites in production
    return [];
  },

  // Configure environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;