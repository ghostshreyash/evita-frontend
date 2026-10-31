import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/*
 * No dev proxy on this branch.
 *
 * `main` proxies /api through the dev server so the API calls are same-origin
 * as far as the browser is concerned and CORS never applies. This branch has no
 * API: `src/lib/api/assets.ts` answers out of the mock register, so there is
 * nothing to forward and `npm run dev` needs no backend running behind it.
 */
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
