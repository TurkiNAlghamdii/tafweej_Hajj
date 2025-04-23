/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true, // This is important for GitHub Pages static export
  },
  output: 'export', // Enables static exports
  basePath: process.env.NODE_ENV === 'production' ? '/tafweej_Hajj' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/tafweej_Hajj/' : '',
  webpack: (config) => {
    // Fixes npm packages that depend on `fs` module
    config.resolve.fallback = { fs: false };
    return config;
  },
};

module.exports = nextConfig; 