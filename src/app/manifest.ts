import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JomBit",
    short_name: "JomBit",
    description: "Split the bill in seconds. Settle with DuitNow. (Student proof of concept)",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#151515",
    theme_color: "#151515",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
