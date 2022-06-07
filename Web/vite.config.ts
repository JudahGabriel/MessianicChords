
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    assetsDir: "code"
  },
  plugins: [
    VitePWA({
      // you can remove base and scope pwa plugin will use the base on vite: defaults to /
      base: "/",
      scope: "/",
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: false,
      strategies: 'injectManifest', // inject the file manifest into the service worker
      srcDir: "src",
      filename: "service-worker.js",
      workbox: {
        swDest: "service-worker.js"
      }
    })
  ]
})
