import type { NextConfig } from "next";

const config: NextConfig = {
  // ให้โหลดรูปจาก backend (FastAPI) และ YouTube thumbnail
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  // proxy ทุกคำขอ /api/* ไปที่ FastAPI backend (กัน CORS ใน dev)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default config;
