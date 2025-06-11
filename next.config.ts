import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for Supabase connection issues
  // experimental: {
  //   serverActions: true,
  // },

  // Remove problematic Permissions-Policy headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()", // Simplified policy
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Enable CORS for Supabase
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_DB_URL}/:path*`,
      },
    ];
  },

  // Required for Supabase realtime connections
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      dns: false,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
