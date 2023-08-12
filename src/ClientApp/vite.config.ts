
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
const outDir = "../wwwroot";
export default defineConfig({
    build: {
        sourcemap: true,
        assetsDir: "assets/js",
        outDir: outDir
    },
    plugins: [
        VitePWA({
            // you can remove base and scope pwa plugin will use the base on vite: defaults to /
            base: "/",
            scope: "/",
            registerType: "autoUpdate",
            injectRegister: "inline",
            manifest: false,
            strategies: 'injectManifest', // inject the file manifest into the service worker
            srcDir: "src",
            filename: "service-worker.js",
            workbox: {
                swDest: "service-worker.js",
                globDirectory: outDir,
                cleanupOutdatedCaches: true,
                globPatterns: [
                    "offline.html",
                    "assets/js/*.js",
                    "assets/js/*.css"
                ]
            },
            devOptions: {
                type: 'module',
                enabled: false
            }
        })
    ]
})