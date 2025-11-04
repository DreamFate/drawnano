import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建时忽略 TypeScript 错误(可选)
    ignoreBuildErrors: true,
  },
  // Docker 优化: 启用 standalone 输出模式
  output: 'standalone',
};

export default nextConfig;
