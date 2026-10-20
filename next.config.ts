import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit each route as /route/index.html so clean URLs resolve on any static
  // host (Cloudflare Pages, S3, Netlify, a plain nginx) without relying on
  // host-specific clean-URL rewriting.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
