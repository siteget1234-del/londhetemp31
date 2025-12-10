/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ✅ ENABLE Image Optimization for better performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'customer-assets.emergentagent.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
    // optimizeCss: true, // Disabled - requires critters package
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-accordion'], // Tree-shake specific packages
  },
  // ✅ Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // ✅ React optimizations
  reactStrictMode: true,
  swcMinify: true, // Use SWC minifier for faster builds
  webpack(config, { dev, isServer }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next'],
      };
    }
    
    // ✅ Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `npm.${packageName?.replace('@', '')}`;
              },
            },
          },
        },
      };
    }
    
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 25000,
    pagesBufferLength: 2,
  },
  // ✅ FIXED: Proper security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          { 
            key: 'X-Frame-Options', 
            value: 'SAMEORIGIN' // ✅ FIXED: Changed from ALLOWALL to SAMEORIGIN
          },
          { 
            key: 'X-Content-Type-Options', 
            value: 'nosniff' 
          },
          { 
            key: 'X-XSS-Protection', 
            value: '1; mode=block' 
          },
          { 
            key: 'Referrer-Policy', 
            value: 'strict-origin-when-cross-origin' 
          },
          // CORS headers
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.CORS_ORIGINS || '*' 
          },
          { 
            key: 'Access-Control-Allow-Methods', 
            value: 'GET, POST, PUT, DELETE, OPTIONS' 
          },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: '*' 
          },
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  // ✅ Enable compression
  compress: true,
  // ✅ Power timeout for long-running API routes
  poweredByHeader: false,
  // ✅ Generate etags for caching
  generateEtags: true,
  
  // ✅ Production source maps (disabled for performance)
  productionBrowserSourceMaps: false,
  
  // ✅ Optimize fonts
  optimizeFonts: true,
};

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
