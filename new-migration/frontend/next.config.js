const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ['pdfkit'],

  webpack: (config, { dev }) => {
    if (dev) {
      // Cache en memoria: evita corrupción de disco y acelera recompilaciones
      config.cache = { type: 'memory' };
    }
    return config;
  },
  // El proxy al backend ya no se hace por rewrite (saltaba la cookie httpOnly).
  // Se hace por route handler catch-all en src/app/api/[...path]/route.ts,
  // que adjunta `Authorization: Bearer <token>` desde la cookie cementerio_auth.
};

module.exports = nextConfig;
