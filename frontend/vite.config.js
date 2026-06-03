import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    hmr: {
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Proxy Socket.IO để tránh ERR_CONNECTION_REFUSED khi chạy local
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true, // Bật WebSocket proxy
      },
    },
  },
});
