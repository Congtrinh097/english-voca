/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build server tu chua (server.js + node_modules toi thieu) cho Docker/Cloud Run
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
