import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Escuta em todas as interfaces de rede, permitindo acesso via IP local
    // (ex.: celular na mesma Wi-Fi), não só em localhost.
    host: true,
  },
});
