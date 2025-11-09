import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/embed/injectForm.js',
      name: 'PWForms',
      fileName: 'injectForm',
      formats: ['iife'],
    },
    // Code splitting and output configuration
    rollupOptions: {
      output: {
        entryFileNames: 'injectForm.js',
        assetFileNames: 'injectForm.css',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'form-vendor': ['react-google-recaptcha'],
        },
      },
    },
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
