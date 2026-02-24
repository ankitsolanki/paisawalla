import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "client", "index.html"),
        injectForm: path.resolve(
          import.meta.dirname,
          "client",
          "src",
          "embed",
          "injectForm.js",
        ),
        injectAuth: path.resolve(
          import.meta.dirname,
          "client",
          "src",
          "embed",
          "injectAuth.js",
        ),
        injectOffers: path.resolve(
          import.meta.dirname,
          "client",
          "src",
          "embed",
          "injectOffers.js",
        ),
        injectFormWithAuth: path.resolve(
          import.meta.dirname,
          "client",
          "src",
          "embed",
          "injectFormWithAuth.js",
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const stableEmbeds = new Set([
            "injectForm",
            "injectAuth",
            "injectOffers",
            "injectFormWithAuth",
          ]);

          if (stableEmbeds.has(chunkInfo.name)) {
            return "[name].js";
          }

          return "assets/[name]-[hash].js";
        },
        assetFileNames: (assetInfo) => {
          // Ensure the embed stylesheet is available at a stable URL
          // that matches what the embed scripts expect: `/injectForm.css`.
          if (assetInfo.name === "embed-styles.css") {
            return "injectForm.css";
          }

          // Default pattern for all other assets
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
