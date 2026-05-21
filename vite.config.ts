import { basename, dirname, join } from 'node:path'
import { defineConfig } from 'vp'
import { playwright } from 'vp/test/browser-playwright'

const root = import.meta.dirname

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
              : ['src/**/*.test.ts']),
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
          include: ['src/tempo/**/*.test.ts', '!src/tempo/e2e.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo',
          include: ['src/tempo/e2e.test.ts'],
          setupFiles: [join(root, 'test/tempo/setup.ts')],
          globalSetup: [join(root, 'test/tempo/setup.global.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'fuzz',
          // Gated behind `FUZZ=true` so the default `pnpm test` run
          // doesn't pick up stochastic property tests. Run via
          // `pnpm test:fuzz` (or `pnpm test:fuzz:ci`).
          include: process.env.FUZZ ? ['src/**/*.fuzz.ts'] : [],
          setupFiles: [join(root, 'test/setup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts'],
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
    ],
  },
})
