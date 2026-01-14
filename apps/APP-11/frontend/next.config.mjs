
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com', // For potential UI assets
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // For quick placeholders
      },
    ],
  },
};

export default nextConfig;
