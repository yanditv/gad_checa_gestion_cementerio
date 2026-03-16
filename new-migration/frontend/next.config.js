const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ['pdfkit'],
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid filesystem cache corruption in local dev rebuilds.
      config.cache = false;
    }

    return config;
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
