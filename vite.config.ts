import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      manifest: {
        name: "Gamemaster",
        short_name: "gamemaster_app",
        start_url: ".",
        display: "standalone",
        icons: [
          {
            src: "favicon.ico",
            sizes: "512x512",
            type: "image/x-icon",
            purpose: 'any maskable'
          }
        ]
      }
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
