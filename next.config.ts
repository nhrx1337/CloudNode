import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  serverExternalPackages: ["bcrypt", "pg", "@tus/server", "@tus/file-store", "@tus/utils", "srvx"],
};

export default nextConfig;
