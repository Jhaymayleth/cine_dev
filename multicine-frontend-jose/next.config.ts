import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // La imagen de producción corre `node server.js` sin instalar dependencias.
  output: 'standalone',
}

export default nextConfig
