import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

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
      {
        find: /^@repo\/schemas$/,
        replacement: fileURLToPath(
          new URL('../../packages/schemas/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  test: {
    globals: true,
    root: '.',
    include: ['./src/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: [
        './src/**/controllers/**/*.ts',
        './src/**/services/**/*.ts',
        './src/common/**/**/*.ts',
      ],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/app.module.ts',
        'src/main.ts',
        'src/migrations/**',
        'src/configs/**',
        'src/common/repositories/**',
      ],
    },
  },
  plugins: [swc.vite()],
});
