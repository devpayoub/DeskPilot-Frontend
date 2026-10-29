/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Next 15 rejects dev requests from origins it does not know. Without this,
  // opening the app on 127.0.0.1 instead of localhost breaks the HMR socket and
  // React never hydrates — the page renders but nothing is interactive.
  allowedDevOrigins: ["localhost", "127.0.0.1"],

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/overview",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
