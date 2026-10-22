import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/env.ts'],
    fileParallelism: false,
    testTimeout: 40000,
    hookTimeout: 40000,
  },
});
