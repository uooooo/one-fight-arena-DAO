import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.onefc.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
    unoptimized: true, // For external images that may have CORS issues
  },
};

export default nextConfig;
