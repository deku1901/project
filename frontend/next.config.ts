import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/static/:path*",
        destination: "http://127.0.0.1:8000/static/:path*",
      },
      {
        source: "/sample_context.json",
        destination: "http://127.0.0.1:8000/sample_context.json",
      },
    ];
  },
};

export default nextConfig;
