import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unex0yvstmuqs1jv.public.blob.vercel-storage.com',
        port: '',
        pathname: '/roof/**',
      },
    ],
  },
};

export default nextConfig;
