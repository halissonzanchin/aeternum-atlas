import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/functions/v1": {
        target: "https://hyivyrietgjdazgizafp.supabase.co",
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/functions/v1": {
        target: "https://hyivyrietgjdazgizafp.supabase.co",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
