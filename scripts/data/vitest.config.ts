import { defineConfig } from 'vitest/config';

// Used only by `npm run data:validate`, which needs raw files saved by `npm run data:fetch`.
export default defineConfig({ cacheDir: 'node_modules/.vite', test: { environment: 'node', include: ['scripts/data/validate-snapshot.test.ts']} });
