// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Optional: configure the development server port to use 3000 (like CRA)
  server: {
    port: 3000,
    open: true, // Automatically opens the browser
  },
  build: {
    outDir: 'build', // Optional: match CRA's default build output directory
  },
});