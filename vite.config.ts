import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    strictPort: true,
    port: 5173,
    origin: "https://socccer.dark-tower.cc",
    host: '0.0.0.0',
    allowedHosts: ['soccer.dark-tower.cc'],
    hmr: {
      host: "soccer.dark-tower.cc",
      clientPort: 443,
      protocol: "wss",
    },
  },
})
