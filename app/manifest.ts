import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kine Study",
    short_name: "Kine Study",
    description: "Repetición espaciada para Kinesiología y Fisiatría (UNAHUR)",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
