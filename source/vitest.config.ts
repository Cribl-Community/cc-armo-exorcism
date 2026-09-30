import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so unit tests don't load the Cribl dev-server plugins.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
