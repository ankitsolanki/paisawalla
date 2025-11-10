import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Check if we're building the library or the app
const isLibraryBuild = process.env.BUILD_MODE === 'library';
const isOffersBuild = process.env.BUILD_MODE === 'offers';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': '{}',
    'process': '{}',
  },
  build: isLibraryBuild
    ? {
        // Library build configuration (for forms)
        lib: {
          entry: 'src/embed/injectForm.js',
          name: 'PWForms',
          fileName: 'injectForm',
          formats: ['iife'],
        },
        outDir: 'dist',
        emptyOutDir: false, // Don't empty so we can have both app and library
        rollupOptions: {
          output: {
            entryFileNames: 'injectForm.js',
            assetFileNames: 'injectForm.css',
            // Note: manualChunks is not supported for IIFE format (inlineDynamicImports is auto-enabled)
            // All code will be bundled into a single file for IIFE library builds
          },
        },
        chunkSizeWarningLimit: 1000,
      }
    : isOffersBuild
    ? {
        // Offers build configuration (for listing page)
        lib: {
          entry: 'src/embed/injectOffers.js',
          name: 'PWOffers',
          fileName: 'injectOffers',
          formats: ['iife'],
        },
        outDir: 'dist',
        emptyOutDir: false, // Don't empty so we can have both app and library
        rollupOptions: {
          output: {
            entryFileNames: 'injectOffers.js',
            assetFileNames: 'injectOffers.css',
            // Note: manualChunks is not supported for IIFE format (inlineDynamicImports is auto-enabled)
            // All code will be bundled into a single file for IIFE library builds
          },
        },
        chunkSizeWarningLimit: 1000,
      }
    : {
        // App build configuration (default)
        outDir: 'dist',
        emptyOutDir: true,
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
      },
  server: {
    port: 5173,
    cors: true,
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-google-recaptcha'],
  },
});
