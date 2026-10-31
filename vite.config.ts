import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  /*
   * Proxying /api through the dev server makes the API calls same-origin as far
   * as the browser is concerned, so CORS never applies and the tablet app can
   * move port without the backend's allow-list having to follow.
   *
   * Dev therefore runs with VITE_API_URL="" (same origin); a deployed build sets
   * the real host and talks to the API directly.
   *
   * Kept in step with occ-frontend's copy of this file.
   */
  const target = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3100"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
