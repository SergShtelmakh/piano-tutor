import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Dev-only: `bun run icons` regenerates the PNG and ICO files in public/ from public/icon.svg.
// The output is committed, so CI and the deploy jobs don't run it.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // The SVG already has its own background and padding.
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
});
