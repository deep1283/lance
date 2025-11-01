/** @type {import('next').NextConfig} */

const nextConfig = {

  // =============================================================================

  // IMAGE OPTIMIZATION & SECURITY

  // =============================================================================

  images: {

    remotePatterns: [

      {

        protocol: "https",

        hostname: "**.r2.dev", // Cloudflare R2 storage

      },

      {

        protocol: "https",

        hostname: "**.supabase.co", // Supabase storage

      },

      // Add other trusted domains as needed

      // {

      //   protocol: "https",

      //   hostname: "yourdomain.com",

      // },

    ],

    // Limit image sizes to prevent abuse

    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Quality levels for image optimization

    qualities: [65, 75, 85, 95, 100],

    // Formats for optimization

    formats: ["image/webp"],

    // Disable dangerous image optimization for untrusted sources

    dangerouslyAllowSVG: false,

    contentDispositionType: "attachment",

    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

  },



  // =============================================================================

  // SECURITY HEADERS (Backup - middleware is primary)

  // =============================================================================

  async headers() {

    return [

      {

        // Apply security headers to all routes

        source: "/:path*",

        headers: [

          {

            key: "X-DNS-Prefetch-Control",

            value: "on",

          },

          {

            key: "X-Content-Type-Options",

            value: "nosniff",

          },

          {

            key: "X-Frame-Options",

            value: "DENY",

          },

          {

            key: "X-XSS-Protection",

            value: "1; mode=block",

          },

          {

            key: "Referrer-Policy",

            value: "strict-origin-when-cross-origin",

          },

          {

            key: "Permissions-Policy",

            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",

          },

        ],

      },

    ];

  },



  // =============================================================================

  // REDIRECTS (Security & UX)

  // =============================================================================

  async redirects() {

    return [

      // Redirect www to non-www (or vice versa)

      // Uncomment if you want to enforce non-www

      // {

      //   source: '/:path*',

      //   has: [

      //     {

      //       type: 'host',

      //       value: 'www.yourdomain.com',

      //     },

      //   ],

      //   destination: 'https://yourdomain.com/:path*',

      //   permanent: true,

      // },

    ];

  },



  // =============================================================================

  // ENVIRONMENT VARIABLES VALIDATION

  // =============================================================================

  env: {

    // Expose only public variables explicitly

    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,

    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  },



  // =============================================================================

  // BUILD CONFIGURATION

  // =============================================================================



  // ⚠️ SECURITY WARNING: This is DANGEROUS!

  eslint: {

    // FIXME: Remove this before production!

    // Ignoring ESLint errors can hide security issues

    ignoreDuringBuilds: true,

  },



  // TypeScript strict mode (recommended)

  typescript: {

    // ⚠️ Don't ignore type errors in production

    ignoreBuildErrors: false,

  },



  // =============================================================================

  // PERFORMANCE & OPTIMIZATION

  // =============================================================================



  // Compress responses

  compress: true,



  // Power React Strict Mode for better error catching

  reactStrictMode: true,



  // =============================================================================

  // EXPERIMENTAL FEATURES (Optional)

  // =============================================================================

  experimental: {

    // Enable server actions if needed

    // serverActions: true,



    // Optimize package imports

    optimizePackageImports: [

      "framer-motion",

      "recharts",

      "@supabase/supabase-js",

    ],

  },



  // =============================================================================

  // OUTPUT CONFIGURATION

  // =============================================================================



  // Standalone output for Docker deployments

  // output: 'standalone',



  // =============================================================================

  // LOGGING

  // =============================================================================



  // Enable logging in development

  logging: {

    fetches: {

      fullUrl: process.env.NODE_ENV === "development",

    },

  },



  // =============================================================================

  // WEBPACK CONFIGURATION (Advanced)

  // =============================================================================

  // Note: Turbopack doesn't use webpack config

  // webpack: (config, { isServer }) => {

  //   config.ignoreWarnings = [

  //     { module: /node_modules\/punycode/ },

  //   ];

  //   if (!isServer && process.env.NODE_ENV === "production") {

  //     config.devtool = false;

  //   }

  //   return config;

  // },

};



// =============================================================================

// ENVIRONMENT VALIDATION (Run on load)

// =============================================================================



// Validate required environment variables

const requiredEnvVars = [

  "NEXT_PUBLIC_SUPABASE_URL",

  "NEXT_PUBLIC_SUPABASE_ANON_KEY",

];



const missingEnvVars = requiredEnvVars.filter(

  (envVar) => !process.env[envVar]

);



if (missingEnvVars.length > 0 && process.env.NODE_ENV !== "test") {

  console.error(

    "❌ Missing required environment variables:",

    missingEnvVars.join(", ")

  );

  console.error("📖 See .env.local.example or SETUP_INSTRUCTIONS.md");



  // Don't throw in development to allow setup

  if (process.env.NODE_ENV === "production") {

    throw new Error("Missing required environment variables");

  }

}



module.exports = nextConfig;
