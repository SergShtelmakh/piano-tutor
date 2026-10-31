/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolveBuildInfo } from './config/buildInfo.ts';

const { basePath, commit, target } = resolveBuildInfo(process.env);

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app shows its own "new version" banner; it never reloads by itself.
      registerType: 'prompt',
      injectRegister: false,
      // No service worker in `bun run dev`: it would cache stale modules.
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Piano Tutor',
        short_name: 'Piano Tutor',
        description: 'Learn piano by playing: instant feedback on every note.',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        theme_color: '#0284c7',
        background_color: '#f8fafc',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The piano samples (public/piano/*.mp3) are precached so the piano also sounds offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,jpg,mp3}'],
        navigateFallback: `${basePath}index.html`,
        cleanupOutdatedCaches: true,
        // Library pieces (public/library/**/*.mid) are not precached, so the install stays small.
        // A piece the learner opens is kept the first time, so it opens again offline.
        runtimeCaching: [
          {
            urlPattern: /\/library\/.+\.mid$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'piano-tutor-library',
              expiration: { maxEntries: 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  define: { __BUILD_INFO__: JSON.stringify({ commit, target }) },
  server: { port: 3000, strictPort: true },
  test: { environment: 'node' },
});
