import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // TAMBAHKAN BLOK INI:
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Sesuaikan jika port vercel dev Anda berbeda
        changeOrigin: true,
      },
    },
  },
  // DAN TAMBAHKAN INI:
  base: "/",
});
