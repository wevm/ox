import { basename, dirname, join } from 'node:path'
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
      include: ['**/src/**'],
      provider: 'v8',
      reporter: process.env.CI ? ['lcov'] : ['text', 'json', 'html'],
    },
    globalSetup: process.env.TYPES
      ? [join(__dirname, './globalSetup.types.ts')]
      : [join(__dirname, './globalSetup.ts')],
    include: [
      ...(process.env.TYPES ? ['src/**/*.snap-d.ts'] : ['src/**/*.test.ts']),
    ],
    passWithNoTests: true,
    resolveSnapshotPath: (path, ext) =>
      join(join(dirname(path), '_snap'), `${basename(path)}${ext}`),
    setupFiles: process.env.TYPES ? [] : [join(__dirname, './setup.ts')],
    testTimeout: 20_000,
  },
})
