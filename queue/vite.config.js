import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this as a project site under /<repo>/queue/, not at
// the domain root, so asset and manifest URLs need that prefix when built
// for Pages. Local dev/build stay at "/" unless VITE_BASE_PATH is set.
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Listening Queue",
        short_name: "Listening Queue",
        description:
          "A personal, 100% offline queue for deciding what album to spin next.",
        theme_color: "#14161b",
        background_color: "#14161b",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        // Album cover images are large/numerous and already cached via
        // IndexedDB blobs, not static build assets — nothing to add here.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: {
    port: 5175,
    host: true,
  },
});
