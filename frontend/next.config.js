/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint is wired into this project; don't fail the production build on it.
  eslint: { ignoreDuringBuilds: true },
  // The browser only ever calls same-origin /api/*; Next proxies it to the
  // backend (BACKEND_URL inside docker-compose, localhost in local dev).
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

module.exports = nextConfig;
