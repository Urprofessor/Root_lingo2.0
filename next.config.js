/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist 等库在 SSR 阶段会引用 canvas,这里禁掉
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
