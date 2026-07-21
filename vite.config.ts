import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// EMERGENCY PRODUCTION FIX
// Minimal configuration to ensure production works
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // DISABLE ALL CUSTOM CHUNKING - Let Vite handle it automatically
    rollupOptions: {
      output: {
        // Only separate the heaviest libraries that are truly optional
        manualChunks: (id) => {
          // Only chunk libraries that are definitely lazy-loaded
          if (id.includes('xlsx')) {
            return 'vendor-xlsx';
          }
          // Everything else stays together - NO REACT SPLITTING
          return undefined;
        },
      },
    },
    // Conservative settings
    chunkSizeWarningLimit: 2000, // Increase limit to avoid warnings
    minify: 'esbuild',
    target: 'es2015',
    // Keep console logs for production debugging
    esbuild: {
      drop: [], // Don't drop anything
    },
  },
}));
