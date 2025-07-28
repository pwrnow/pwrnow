import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'localhost',
      'api.pwrnow.pl',
      // add production domains here as needed
    ],
  },
};

export default nextConfig;
