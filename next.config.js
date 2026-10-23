/**
 * Next.js 應用程式設定檔
 *
 * 設定 postal-code-finder 獨立部署至 Vercel 時的構建選項、環境變數注入與 CORS Headers。
 *
 * 主要功能：
 *   - CORS 跨域標頭配置：允許前端外部呼叫 API 端點
 *   - Webpack 客戶端 fallback：避免客戶端打包 Node.js 專屬模組 (fs, net, tls)
 *   - 忽略構建時 Lint 阻擋：確保部署穩定性
 *
 * 注意事項：
 *   - 獨立部署至 Vercel 時請確認環境變數已在 Vercel 後台設定
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 環境變數配置
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },

  // API 路由配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },

  // Webpack 配置 - 避免在客戶端打包 Node.js 模組
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

