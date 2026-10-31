import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default to local edge Kiosk Agent on port 5000, with optional override to central backend (8080)
  const target = env.VITE_API_PROXY || "http://localhost:5000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "../agent/public",
      emptyOutDir: true,
    },
  };
});
