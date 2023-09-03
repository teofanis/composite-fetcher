/// <reference types="vitest" />

import { configDefaults, defineConfig } from 'vitest/config';

const config = defineConfig({
  esbuild: {
    jsxFragment: 'Fragment',
    jsxFactory: 'h',
  },
  base: '.',
  test: {
    ...configDefaults,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      '@/': '/src/',
    },
  },
});
export default config;
