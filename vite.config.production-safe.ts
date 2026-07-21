import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Production-safe Vite configuration
// Fixes the vendor chunking issues that cause blank page in production
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
    // Simplified module preloading - more conservative approach
    modulePreload: {
      polyfill: false,
      // More conservative preloading strategy
      resolveDependencies: (filename, deps) => {
        // Only preload critical vendor chunks, avoid over-filtering
        return deps.filter(dep => 
          dep.includes('vendor-react') || 
          dep.includes('index-') // Main app chunk
        );
      }
    },
    rollupOptions: {
      output: {
        // Simplified chunking strategy to avoid dependency issues
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Keep React ecosystem together to avoid context issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // UI libraries that work well together
            if (id.includes('@radix-ui') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            
            // Supabase - keep isolated
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase';
            }
            
            // Heavy optional libraries - these are safe to separate
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            
            if (id.includes('qrcode') || id.includes('jsqr') || id.includes('html5-qrcode')) {
              return 'vendor-qr';
            }
            
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            
            // Icons - safe to separate since they're just exports
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // Everything else stays in main vendor chunk
            // This prevents context/dependency issues
            return 'vendor';
          }
        },
      },
      external: [],
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Conservative minification settings
    minify: 'esbuild',
    target: 'es2015',
    // Don't drop console in production for debugging
    esbuild: {
      drop: ['debugger'], // Only drop debugger, keep console for production debugging
    },
  },
}));
