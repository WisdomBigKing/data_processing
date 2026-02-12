import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // 服务器部署配置
  output: 'standalone',
  
  // 实验性功能
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  // 图片优化配置
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
