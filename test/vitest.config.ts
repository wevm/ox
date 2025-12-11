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
      include: ['./src/**'],
      provider: 'v8',
      reporter: process.env.CI ? ['lcov'] : ['text', 'json', 'html'],
    },
    passWithNoTests: true,
    retry: 3,
    resolveSnapshotPath: (path, ext) =>
      join(join(dirname(path), '_snap'), `${basename(path)}${ext}`),
    hookTimeout: 20_000,
    testTimeout: 20_000,

    projects: [
      {
        extends: true,
        test: {
          name: 'core,ercs',
          globalSetup: process.env.TYPES
            ? [join(__dirname, './setup.global.types.ts')]
            : [join(__dirname, './setup.global.ts')],
          include: [
            ...(process.env.TYPES
              ? ['src/**/*.snap-d.ts']
              : ['src/**/*.test.ts']),
            '!src/tempo/**',
          ],
          setupFiles: process.env.TYPES ? [] : [join(__dirname, './setup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo',
          include: ['src/tempo/**/*.test.ts'],
          setupFiles: [join(__dirname, './tempo/setup.ts')],
          globalSetup: [join(__dirname, './tempo/setup.global.ts')],
        },
      },
    ],
  },
})
