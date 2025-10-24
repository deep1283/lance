/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**.r2.dev",
        },
      ],
    },
  
    
    eslint: {
      ignoreDuringBuilds: true, // Prevent ESLint errors from failing Vercel builds
    },
  };
  
  module.exports = nextConfig;
  