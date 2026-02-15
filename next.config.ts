import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["e2b", "better-sqlite3", "@modelcontextprotocol/sdk", "croner"],
};

export default nextConfig;
