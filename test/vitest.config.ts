import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      ox: join(__dirname, '../src'),
      '~test': join(__dirname, '../test/src'),
    },
    benchmark: {
      include: ['src/**/*.bench.ts'],
      outputFile: './.bench/report.json',
    },
    coverage: {
      all: false,
      exclude: ['**/_cjs/**', '**/_esm/**'],
      include: ['**/src/**'],
      provider: 'v8',
      reporter: process.env.CI ? ['lcov'] : ['text', 'json', 'html'],
    },
    include: [
      ...(process.env.TYPES ? ['**/*.bench-d.ts'] : []),
      'src/**/*.test.ts',
    ],
    globalSetup: process.env.TYPES ? [] : [join(__dirname, './globalSetup.ts')],
    passWithNoTests: true,
    setupFiles: process.env.TYPES ? [] : [join(__dirname, './setup.ts')],
  },
})
