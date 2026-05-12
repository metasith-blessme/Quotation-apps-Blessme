import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "bcryptjs",
    "@react-pdf/renderer",
  ],
  outputFileTracingIncludes: {
    "/api/quotations/\\[id\\]/pdf": ["./public/fonts/**/*"],
    "/api/invoices/\\[id\\]/pdf": ["./public/fonts/**/*"],
    "/api/billings/\\[id\\]/pdf": ["./public/fonts/**/*"],
    "/api/receipts/\\[id\\]/pdf": ["./public/fonts/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
