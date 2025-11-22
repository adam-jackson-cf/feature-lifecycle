import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // Use Node environment for real API calls
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
    // Don't use setup file that includes MSW
    testTimeout: 120000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
