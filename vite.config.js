// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [react(),glsl()],
  // Optional: configure the development server port to use 3000 (like CRA)
  server: {
    port: 3000,
    open: true, // Automatically opens the browser
  },
  build: {
    outDir: 'build', // Optional: match CRA's default build output directory
  },
  optimizeDeps: {
        esbuildOptions: {
            loader: {
                ".glsl": "text",
            },
        },
    },
});