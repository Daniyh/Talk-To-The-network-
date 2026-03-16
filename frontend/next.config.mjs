/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In development: proxy to local Python server
    // In production: proxy to Render backend (set BACKEND_URL in Vercel env vars)
    const backendUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000'
        : (process.env.BACKEND_URL ?? '');

    if (!backendUrl) return [];

    return [
      {
        source: '/api/intent',
        destination: `${backendUrl}/api/intent`,
      },
      {
        source: '/api/clarify',
        destination: `${backendUrl}/api/clarify`,
      },
    ];
  },
};

export default nextConfig;
