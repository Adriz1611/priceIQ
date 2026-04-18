import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vijay Sales
      { protocol: "https", hostname: "vsprod.vijaysales.com" },
      { protocol: "https", hostname: "www.vijaysales.com" },
      // Amazon.in
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-amazon.com" },
      // Flipkart
      { protocol: "https", hostname: "rukminim2.flixcart.com" },
      { protocol: "https", hostname: "rukminim1.flixcart.com" },
    ],
  },
};

export default nextConfig;
