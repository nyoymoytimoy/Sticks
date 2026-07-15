import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // `backend` is a workspace package shipped as TS source (no build step of
  // its own), so Next.js's compiler needs to transpile it like local code.
  transpilePackages: ["backend"],
  // Points file tracing (for `output: standalone`) at the monorepo root
  // instead of frontend/, so the traced output includes the `backend`
  // workspace package it imports.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
