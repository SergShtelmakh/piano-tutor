/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolveBuildInfo } from './config/buildInfo.ts';

const { basePath, commit, target } = resolveBuildInfo(process.env);

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  define: { __BUILD_INFO__: JSON.stringify({ commit, target }) },
  server: { port: 3000, strictPort: true },
  test: { environment: 'node' },
});
