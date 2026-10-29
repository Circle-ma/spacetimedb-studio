import { fileURLToPath, URL } from "node:url";
import pandacss from "@pandacss/vite";
import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pandacss(),
    solid({
      start: true,
      // Default is client-rendered SPA onto a prerendered static document shell.
      // Set `ssr: true` to enable streaming server-side rendering with zero config changes.
      ssr: false,
    }),
  ],
  resolve: {
    alias: {
      "solid-js/web": "@solidjs/web",
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/stdb-proxy": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stdb-proxy/, ""),
        ws: true,
      },
    },
  },
  build: {
    target: "esnext",
  },
});
