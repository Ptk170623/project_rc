import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Listen on all network interfaces, not just localhost, so it's
    // reachable via LAN IP (e.g. a phone on the same Wi-Fi).
    host: true,
  },
});
