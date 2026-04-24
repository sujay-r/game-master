import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/service-worker',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        swSrc: 'src/service-worker/sw.ts',
        swDest: 'dist/sw.js',
      },
      manifest: {
        name: 'Gamemaster',
        short_name: 'gamemaster_app',
        start_url: '.',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '512x512',
            type: 'image/x-icon',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
