import type { NextConfig } from "next";

/**
 * Extra origins allowed to invoke Server Actions and serve dev assets.
 */
const tunnelOrigins = ["**.use.devtunnels.ms", "**.devtunnels.ms", "**.trycloudflare.com"];
const extraOrigins = (process.env.ALLOWED_ACTION_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [...tunnelOrigins, ...extraOrigins],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", ...tunnelOrigins, ...extraOrigins],
    },
  },
};

export default nextConfig;
