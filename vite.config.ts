import { execFileSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

function buildSha(): string {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (/^[a-f0-9]{40}$/.test(sha)) return sha;
  } catch {
    // Not a Git checkout (for example a CI tarball): fall through.
  }
  const fromEnv = process.env.GITHUB_SHA;
  return fromEnv && /^[a-f0-9]{40}$/.test(fromEnv) ? fromEnv : 'unknown';
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
