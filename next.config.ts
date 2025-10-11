import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Disable image optimization for Vercel compatibility
  },
};

export default nextConfig;
