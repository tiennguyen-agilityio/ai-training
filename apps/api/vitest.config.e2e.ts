import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Tests read the package source, never a stale dist.
    alias: [
      {
        find: /^@repo\/constants$/,
        replacement: fileURLToPath(
          new URL('../../packages/constants/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  test: {
    globals: true,
    root: '.',
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    setupFiles: ['./test/setup-env.ts'],
    fileParallelism: false,
  },
  plugins: [swc.vite()],
});
