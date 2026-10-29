import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Tests read @repo/constants' source, never a stale dist.
    alias: [
      {
        find: /^@repo\/constants$/,
        replacement: fileURLToPath(
          new URL('../constants/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  test: {
    globals: true,
    include: ['./src/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['./src/**/*.ts'],
    },
  },
});
