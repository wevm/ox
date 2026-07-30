import { basename, dirname, join } from 'node:path'
import { defineConfig } from 'vp'
import { playwright } from 'vp/test/browser-playwright'
import {
  port as tempoMultisigPort,
  tag as tempoMultisigTag,
} from './test/tempo/multisig.js'

const root = import.meta.dirname

/**
 * Per-property timeout for the fuzz projects.
 *
 * `testTimeout` is sized for unit tests. A fuzz property runs `FC_NUM_RUNS`
 * cases inside one `test`, so its wall time scales with that budget and with
 * how slow the machine is -- a CI runner is several times slower than a
 * developer's, which is what made 10k runs time out at 20s there.
 */
const fuzzTimeout = 120_000

/**
 * Engines the portable browser projects run against.
 *
 * A function, not a shared array: Vitest stamps a resolved name onto each
 * instance object, so handing the same objects to two projects makes the second
 * collide with the first.
 */
const browserInstances = () => [
  { browser: 'chromium' },
  { browser: 'firefox' },
  { browser: 'webkit' },
]

export default defineConfig({
  fmt: {
    singleQuote: true,
    semi: false,
    trailingComma: 'all',
    printWidth: 80,
    ignorePatterns: [
      'contracts/**',
      'contracts/generated.ts',
      'test/kzg/**',
      '**/tsconfig.json',
      '**/tsconfig.*.json',
      '**/package.json',
      '**/*.md',
    ],
  },
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'jsdoc'],
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      { name: 'jsdoc-js', specifier: 'eslint-plugin-jsdoc' },
      { name: 'tsdoc', specifier: 'eslint-plugin-tsdoc' },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'no-console': ['error', { allow: ['log'] }],
      'jsdoc/check-access': 'error',
      'jsdoc/check-property-names': 'error',
      'jsdoc/check-tag-names': [
        'error',
        {
          definedTags: ['category', 'entrypointCategory', 'remarks'],
        },
      ],
      'jsdoc/empty-tags': 'error',
      'jsdoc/implements-on-classes': 'error',
      'jsdoc/no-defaults': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-property': 'error',
      'jsdoc/require-property-name': 'error',
      // Intentional: `& unknown` flattens computed types for inference.
      'typescript/no-redundant-type-constituents': 'off',
      // Error messages embed raw user input via template literals; the
      // resulting `[object Object]` / typeof-string output is acceptable.
      'typescript/no-base-to-string': 'off',
      'typescript/restrict-template-expressions': 'off',
    },
    overrides: [
      {
        files: ['src/**/*.ts'],
        rules: {
          'jsdoc-js/require-jsdoc': ['error', { publicOnly: true }],
          'jsdoc-js/require-description': 'error',
          'jsdoc-js/require-example': 'error',
          // Disabled: example code inside @example blocks contains `{`/`}`,
          // `<->`, indented code fences, and twoslash directives like
          // `// @noErrors`, all of which TSDoc parses as syntax errors.
          'tsdoc/syntax': 'off',
        },
      },
      {
        // Neither internal helpers nor tests are public API, so the
        // public-documentation rules do not apply -- and `require-example`'s
        // autofix corrupts JSDoc on nested functions, which tests are full of.
        files: ['src/**/internal/**/*.ts', 'src/**/_test/**/*.ts'],
        rules: {
          'jsdoc-js/require-jsdoc': 'off',
          'jsdoc-js/require-description': 'off',
          'jsdoc-js/require-example': 'off',
        },
      },
      {
        files: ['scripts/**', 'test/**'],
        rules: {
          'no-console': ['error', { allow: ['log', 'warn', 'error'] }],
        },
      },
    ],
    settings: {
      jsdoc: {
        ignoreInternal: true,
        ignorePrivate: true,
        tagNamePreference: {
          category: 'category',
          entrypointCategory: 'entrypointCategory',
        },
      },
    },
    options: {
      typeAware: true,
    },
    ignorePatterns: ['contracts/**', 'contracts/generated.ts', 'test/kzg/**'],
  },
  // `FC_NUM_RUNS` reaches the fuzz files through `import.meta.env`, so that the
  // same properties run under Node and in a browser, where `process` is absent.
  envPrefix: ['VITE_', 'FC_'],
  test: {
    alias: {
      ox: join(root, 'src'),
      '~test': join(root, 'test/src'),
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
          name: 'core',
          globalSetup: process.env.TYPES
            ? [join(root, 'test/setup.global.types.ts')]
            : [join(root, 'test/setup.global.ts')],
          include: [
            ...(process.env.TYPES
              ? ['src/**/*.snap-d.ts']
              : ['src/**/*.test.ts', 'src/**/*.conformance.ts']),
            '!src/tempo/**',
            '!src/**/*.browser.test.ts',
          ],
          setupFiles: process.env.TYPES ? [] : [join(root, 'test/setup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo-unit',
          include: [
            'src/tempo/**/*.test.ts',
            '!src/tempo/e2e.test.ts',
            '!src/tempo/multisig.e2e.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo',
          include: ['src/tempo/e2e.test.ts'],
          setupFiles: [join(root, 'test/tempo/setup.ts')],
          globalSetup: [join(root, 'test/tempo/setup.global.ts')],
          hookTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo-multisig',
          include: ['src/tempo/multisig.e2e.test.ts'],
          setupFiles: [join(root, 'test/tempo/setup.ts')],
          globalSetup: [join(root, 'test/tempo/setup.global.multisig.ts')],
          hookTimeout: 60_000,
          env: {
            VITE_TEMPO_ENV: 'localnet',
            VITE_TEMPO_PORT: String(tempoMultisigPort),
            VITE_TEMPO_RPC_URL: '',
            VITE_TEMPO_TAG: tempoMultisigTag,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'fuzz',
          // Gated behind `FUZZ=true` so the default `pnpm test` run
          // doesn't pick up stochastic property tests. Run via
          // `pnpm test:fuzz`.
          include: process.env.FUZZ ? ['src/**/*.fuzz.ts'] : [],
          setupFiles: [join(root, 'test/setup.ts')],
          // A property is thousands of cases, not one, so the unit-test
          // default does not apply. The job's own timeout is the real guard.
          testTimeout: fuzzTimeout,
        },
      },
      {
        extends: true,
        test: {
          // Everything that does not need a virtual authenticator, on every
          // engine Playwright can drive. Native codecs differ between them --
          // Chromium 145 read `U+C230` as a hex digit where 149 rejects it --
          // so an engine ox does not run here is one it is not checked on.
          name: 'browser',
          // `*.conformance.ts` is deliberately not a `*.test.ts`: the same
          // file is collected here and by `core`, so a suite is written once
          // and every runtime runs whichever tiers it has.
          include: [
            'src/**/*.browser.test.ts',
            'src/**/*.conformance.ts',
            '!src/webauthn/**',
          ],
          deps: {
            // Composite engine modules re-export the public API. Discover its
            // default implementations before browsers connect.
            optimizer: {
              client: {
                include: [
                  '@noble/ciphers/aes.js',
                  '@noble/curves/ed25519.js',
                  '@noble/curves/secp256k1.js',
                  '@noble/hashes/blake3.js',
                  '@noble/hashes/hmac.js',
                  '@noble/hashes/legacy.js',
                  '@noble/hashes/pbkdf2.js',
                  '@noble/hashes/scrypt.js',
                  '@noble/hashes/sha2.js',
                  '@noble/hashes/sha3.js',
                  '@scure/bip32',
                  '@scure/bip39',
                  '@scure/bip39/wordlists/czech.js',
                  '@scure/bip39/wordlists/english.js',
                  '@scure/bip39/wordlists/french.js',
                  '@scure/bip39/wordlists/italian.js',
                  '@scure/bip39/wordlists/japanese.js',
                  '@scure/bip39/wordlists/korean.js',
                  '@scure/bip39/wordlists/portuguese.js',
                  '@scure/bip39/wordlists/simplified-chinese.js',
                  '@scure/bip39/wordlists/spanish.js',
                  '@scure/bip39/wordlists/traditional-chinese.js',
                ],
              },
            },
          },
          browser: {
            enabled: true,
            provider: playwright() as never,
            headless: true,
            instances: browserInstances(),
            screenshotFailures: false,
          },
        },
      },
      {
        extends: true,
        test: {
          // WebAuthn needs a virtual authenticator, installed over CDP by
          // `test/setup.browser.ts`. CDP is Chromium-only, and that is what
          // holds this project to one engine -- keep it to the tests that
          // need it, so everything else stays portable.
          name: 'browser-webauthn',
          include: ['src/webauthn/**/*.browser.test.ts'],
          setupFiles: [join(root, 'test/setup.browser.ts')],
          browser: {
            enabled: true,
            provider: playwright() as never,
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
          },
        },
      },
      {
        extends: true,
        test: {
          // Browser-compatible properties from the `fuzz` project, put in
          // front of native codecs only a browser has. Gated behind
          // `FUZZ=true` alongside it.
          name: 'fuzz-browser',
          deps: {
            // Discover every direct fuzz oracle before browsers connect.
            // Mid-run dependency optimization reloads the test runtime.
            optimizer: {
              client: {
                include: [
                  '@fast-check/vitest',
                  '@noble/ciphers/aes.js',
                  '@noble/curves/ed25519.js',
                  '@noble/curves/nist.js',
                  '@noble/curves/secp256k1.js',
                  '@noble/hashes/blake3.js',
                  '@noble/hashes/hmac.js',
                  '@noble/hashes/legacy.js',
                  '@noble/hashes/pbkdf2.js',
                  '@noble/hashes/scrypt.js',
                  '@noble/hashes/sha2.js',
                  '@noble/hashes/sha3.js',
                  '@scure/bip32',
                  '@scure/bip39',
                  '@scure/bip39/wordlists/czech.js',
                  '@scure/bip39/wordlists/english.js',
                  '@scure/bip39/wordlists/french.js',
                  '@scure/bip39/wordlists/italian.js',
                  '@scure/bip39/wordlists/japanese.js',
                  '@scure/bip39/wordlists/korean.js',
                  '@scure/bip39/wordlists/portuguese.js',
                  '@scure/bip39/wordlists/simplified-chinese.js',
                  '@scure/bip39/wordlists/spanish.js',
                  '@scure/bip39/wordlists/traditional-chinese.js',
                  'ethers',
                ],
              },
            },
          },
          include: process.env.FUZZ ? ['src/**/*.fuzz.ts', '!src/node/**'] : [],
          testTimeout: fuzzTimeout,
          browser: {
            enabled: true,
            provider: playwright() as never,
            headless: true,
            instances: browserInstances(),
            screenshotFailures: false,
          },
        },
      },
    ],
  },
})
