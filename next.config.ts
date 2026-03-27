import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "bcryptjs",
    "@react-pdf/renderer",
  ],
};

export default nextConfig;
