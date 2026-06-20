import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/',
  plugins: [tailwindcss(), svelte()],
  server: {
    proxy: {
      '/recommend': 'http://localhost:8787',
      '/feedback': 'http://localhost:8787',
    },
  },
});
