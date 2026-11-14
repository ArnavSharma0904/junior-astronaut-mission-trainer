import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Module boundaries from docs/ARCHITECTURE.md are enforced here, not just described.
const engineGlobals = ['window', 'document', 'fetch', 'localStorage', 'sessionStorage', 'navigator'].map((name) => ({
  name,
  message: 'src/game is a pure engine: no DOM, network or storage.',
}));

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results', '.agent-bus', 'scripts/*.mjs', 'scripts/*.sh'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-restricted-imports': ['error', { patterns: [{ group: ['three', 'three/*', '@react-three/*'], message: 'WebGL libraries are allowed only under src/scene/webgl.' }] }],
    },
  },
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', ...engineGlobals],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'The engine is deterministic.' },
        { object: 'Date', property: 'now', message: 'The engine has no clock.' }],
      'no-restricted-imports': ['error', { patterns: [{ group: ['react', 'react-dom', 'react/*', '../components/*', '../scene/*', '../state/*', '../styles/*', 'three', '@react-three/*'], message: 'src/game may import only itself and zod.' }] }],
    },
  },
  {
    files: ['src/adapters/**/*.ts', 'src/data/**/*.ts', 'src/content/**/*.ts'],
    rules: { 'no-restricted-globals': ['error', { name: 'fetch', message: 'No runtime network: data is a committed snapshot.' }] },
  },
  {
    files: ['src/scene/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['**/game/reducer', '**/state/*'], message: 'The scene renders selector output and never mutates state.' }] }] },
  },
  {
    files: ['scripts/data/**/*.mjs', '*.config.{js,ts}', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
