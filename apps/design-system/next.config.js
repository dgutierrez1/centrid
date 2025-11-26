/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@centrid/ui'],
  // Use parent directory's Tailwind and components
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '..', 'src'),
    };
    return config;
  },
};
