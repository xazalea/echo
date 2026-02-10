import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // For Cloudflare deployment, uncomment the following:
  // output: 'export',
  
  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production', // Only for static export
  },
  
  // Enable React compiler for better performance
  reactCompiler: true,
  
  // Turbopack enabled by default in Next.js 16
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // Strict mode
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
