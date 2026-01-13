import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import macros from "unplugin-parcel-macros";

export default defineConfig({
  plugins: [
    macros.vite(), // MUST come before other plugins for S2 style macros
    react(),
  ],
  css: {
    transformer: "lightningcss", // Required for S2 CSS optimization
  },
  build: {
    cssMinify: "lightningcss", // Deduplicates atomic CSS rules from style macros
    rollupOptions: {
      output: {
        // Bundle ALL S2 + macro CSS into single file to prevent duplicate rules
        manualChunks: {
          "s2-styles": ["@react-spectrum/s2"],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
