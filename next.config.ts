import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vijay Sales (all subdomains)
      { protocol: "https", hostname: "**.vijaysales.com" },
      { protocol: "https", hostname: "vijaysales.com" },
      // Amazon.in
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-amazon.com" },
      { protocol: "https", hostname: "**.media-amazon.com" },
      // Flipkart CDN
      { protocol: "https", hostname: "**.flixcart.com" },
    ],
  },
};

export default nextConfig;
