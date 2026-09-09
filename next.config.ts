import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ★ Electron için static export
  output: 'export',
  trailingSlash: true,
  
  // ★ Gelişmiş boyut optimizasyonu
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'motion/react', 
      'date-fns', 
      'framer-motion', 
      'clsx', 
      'tailwind-merge'
    ],
  },
  
  compress: true, // Gzip sıkıştırma (Electron'da faydalı)

  // ★ Static export'ta next/image optimize edemez
  images: {
    unoptimized: true,
  },

  transpilePackages: ['motion'],

  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;