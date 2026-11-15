import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { resolveBuildSha } from './scripts/build-sha.mjs';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

function buildSha(): string {
  return resolveBuildSha(appRoot);
}

export default defineConfig({
  plugins: [react()],
  cacheDir: 'node_modules/.vite',
  define: { __BUILD_SHA__: JSON.stringify(buildSha()) },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
  },
});
