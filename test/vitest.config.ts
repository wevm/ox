import { basename, dirname, join } from 'node:path'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import {
  port as tempoConfigurableAccountsPort,
  tag as tempoConfigurableAccountsTag,
} from './tempo/configurableAccounts.js'

/**
 * Per-property timeout for the fuzz project.
 *
 * `testTimeout` is sized for unit tests. A fuzz property runs `FC_NUM_RUNS`
 * cases inside one `test`, so its wall time scales with that budget and with
 * how slow the machine is.
 */
const fuzzTimeout = 120_000

export default defineConfig({
  // `FC_NUM_RUNS` reaches the fuzz files through `import.meta.env` (see
  // `test/fuzz/numRuns.ts`).
  envPrefix: ['VITE_', 'FC_'],
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
    hookTimeout: 60_000,
    testTimeout: 20_000,

    projects: [
      // TODO: remove once frame txs in anvil
      {
        extends: true,
        test: {
          name: 'tmp_frames',
          include: [
            'src/core/_test/TxEnvelopeEip8141.test.ts',
            'test/frames/**/*.test.ts',
          ],
          globalSetup: [join(__dirname, './frames/setup.global.ts')],
          setupFiles: [join(__dirname, './frames/setup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'core',
          globalSetup: process.env.TYPES
            ? [join(__dirname, './setup.global.types.ts')]
            : [join(__dirname, './setup.global.ts')],
          include: [
            ...(process.env.TYPES
              ? ['src/**/*.snap-d.ts']
              : ['src/**/*.test.ts']),
            '!src/tempo/**',
            '!src/core/_test/TxEnvelopeEip8141.test.ts',
            '!src/**/*.browser.test.ts',
          ],
          setupFiles: process.env.TYPES ? [] : [join(__dirname, './setup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'fuzz',
          // Gated behind `FUZZ=true` so the default `pnpm test` run doesn't
          // pick up stochastic property tests. Run via `pnpm test:fuzz`.
          include: process.env.FUZZ ? ['src/**/*.fuzz.ts'] : [],
          setupFiles: [
            join(__dirname, './setup.ts'),
            join(__dirname, './fuzz/setup.ts'),
          ],
          // A property is thousands of cases, not one, so the unit-test
          // default does not apply. The job's own timeout is the real guard.
          testTimeout: fuzzTimeout,
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo-unit',
          include: [
            'src/tempo/**/*.test.ts',
            '!src/tempo/e2e.test.ts',
            '!src/tempo/configurableAccounts.e2e.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo',
          include: ['src/tempo/e2e.test.ts'],
          setupFiles: [join(__dirname, './tempo/setup.ts')],
          globalSetup: [join(__dirname, './tempo/setup.global.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo-configurable-accounts',
          include: ['src/tempo/configurableAccounts.e2e.test.ts'],
          setupFiles: [join(__dirname, './tempo/setup.ts')],
          globalSetup: [
            join(__dirname, './tempo/setup.global.configurableAccounts.ts'),
          ],
          env: {
            VITE_TEMPO_ENV: 'localnet',
            VITE_TEMPO_PORT: String(tempoConfigurableAccountsPort),
            VITE_TEMPO_RPC_URL: '',
            VITE_TEMPO_TAG: tempoConfigurableAccountsTag,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts'],
          setupFiles: [join(__dirname, './setup.browser.ts')],
          browser: {
            enabled: true,
            provider: playwright() as never,
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
          },
        },
      },
    ],
  },
})
