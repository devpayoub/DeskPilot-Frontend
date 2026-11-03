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
  // No `/dashboard` redirect here. A static one always landed on
  // `/dashboard/overview`, which is the screen a requester may not open — and it
  // fired before any route code could ask who was calling. `/dashboard/page.tsx`
  // decides the landing screen from the session's capabilities instead.
};

export default nextConfig;
