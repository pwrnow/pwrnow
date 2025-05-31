/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'grpczfvicmktrahsffnf.supabase.co',
      },
    ],
    // Cache images for 31 days (2678400 seconds) to reduce transformations and cache writes
    minimumCacheTTL: 2678400,
    // Use webp format for better compression while maintaining quality
    formats: ['image/webp'],
    // Configure device sizes to match common breakpoints and reduce transformations
    deviceSizes: [640, 768, 1024, 1280, 1600],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  rewrites: async () => {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
