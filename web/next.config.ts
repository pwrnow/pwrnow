import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'localhost',
      // add production domains here as needed
    ],
  },
};

export default nextConfig;
