import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Cans are transparent PNGs; keep the alpha channel and serve modern formats.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
