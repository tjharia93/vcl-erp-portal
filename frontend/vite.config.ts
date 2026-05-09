import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Built bundle is served by Frappe at /assets/vcl_portal/portal_v2/.
// Output goes into the Frappe app's public assets so `bench build` picks it up.
export default defineConfig({
  plugins: [react()],
  base: '/assets/vcl_portal/portal_v2/',
  build: {
    outDir: '../vcl_portal/public/portal_v2',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) => {
          if (info.name && info.name.endsWith('.css')) return 'index.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  server: {
    port: 5174,
    host: true,
  },
})
