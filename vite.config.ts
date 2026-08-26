import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets keep the build compatible with GitHub Pages project sites.
  base: './',
});
