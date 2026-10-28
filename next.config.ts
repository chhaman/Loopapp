import type { NextConfig } from "next";
import { nextHeaders } from "./security-headers.mjs";

const nextConfig: NextConfig = {
  // Cache Components stays off: every page reads the session/preferences per request.
  // See docs/adr/0002-rendering-and-runtime.md.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  async headers() {
    return nextHeaders();
  },
};

export default nextConfig;
