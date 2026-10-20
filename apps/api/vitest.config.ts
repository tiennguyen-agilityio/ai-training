import swc from 'unplugin-swc';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
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
