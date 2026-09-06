import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯静态导出，产物在 out/，可部署到 Cloudflare Pages 等任意静态托管
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
