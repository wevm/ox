/**
 * What the metric scripts read about the library they measure: where the checkout is, where its
 * build and declarations are, which entry points its package.json publishes, and the project's
 * own inputs from `local/config.ts`. Every other script in this directory reads the
 * library only through this module.
 *
 * The scripts run from the project root, which Uphill makes the working directory. An entry point
 * is each subpath of package.json's `exports` whose conditions name a built module (`default` or
 * `import`). Its source is the `src` condition, or else the module at the same
 * path under `src/` with a `.ts` extension. Each entry point is named by the specifier a consumer
 * imports, such as `lib` or `lib/Math`, and a value several entries reach is named after the first.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * The project's inputs, the default export of `local/config.ts`. Every key is
 * optional, and a project without the file measures with the defaults.
 */
export type Config = {
  /**
   * The directory `build` writes the ES modules to, relative to the root. Defaults to the first
   * directory of the root entry's built module, such as `dist`.
   */
  build?: string | undefined
  /**
   * Returns a function that empties the library's caches, and calls `onWrite` on each write to
   * them, so the speed and fuzz benches start every call with empty caches. Without it, caches
   * stay as each call leaves them.
   */
  caches?: ((onWrite: () => void) => Promise<() => void>) | undefined
  /** Inputs of the call-types script. */
  callTypes?:
    | {
        /**
         * Functions that assert, besides vitest's `expect`, `expectTypeOf` and `assertType`, such
         * as a type assertion helper. A statement that calls one declares nothing a later call
         * needs, so a measured call is checked without it. Defaults to none.
         */
        assertions?: readonly string[] | undefined
        /**
         * The test files to take calls from, as globs relative to the root in `Bun.Glob` syntax,
         * which has braces but no extglobs. Defaults to the files of vitest's
         * runtime and type tests, `**\/*.{test,spec}.?(c|m)[jt]s?(x)` and
         * `**\/*.{test,spec}-d.?(c|m)[jt]s?(x)`. Files under `node_modules` and the build are
         * always left out.
         */
        tests?: readonly string[] | undefined
      }
    | undefined
  /** Export subpaths to leave out, such as `./index.docs`. Patterns hold no `*`. */
  exclude?: readonly string[] | undefined
  /** Inputs of the fuzz script. */
  fuzz?:
    | {
        /**
         * The library's documented error base class, named as the metrics name values, such as
         * `lib:Errors.BaseError`. The properties module reads it as `BaseError`. Defaults to
         * `Error`.
         */
        baseError?: string | undefined
        /**
         * The corpus file, relative to the root, which holds the recorded argument sets that the
         * fuzzer mutates. Defaults to `local/fuzz-corpus.json`.
         */
        corpus?: string | undefined
        /**
         * Built-in errors a function documents, by function name, as a pattern of the error's
         * name, such as `{ 'lib:Json.parse': /^SyntaxError$/ }`. Defaults to none.
         */
        documentedErrors?: Readonly<Record<string, RegExp>> | undefined
        /**
         * The command that formats the corpus after a snapshot, run from the root with the file
         * appended, such as `['node_modules/.bin/format', '--write']`. Defaults to none.
         */
        format?: readonly string[] | undefined
        /**
         * Functions whose output may hold `0x` strings that are not hex, such as an encoder
         * whose prefix the caller picks. Defaults to none.
         */
        freeOutput?: readonly string[] | undefined
        /** Functions that change global state, which run alone. Defaults to none. */
        isolated?: readonly string[] | undefined
        /** The most characters the corpus holds. Defaults to no limit. */
        maxLength?: number | undefined
        /**
         * The properties module, relative to the root, whose exports `fuzz-lib.ts` describes as
         * `Properties`: structured properties, hand-written seeds, and mutation budgets. Without
         * it, each function gets only boundary mutations of its recorded arguments.
         */
        properties?: string | undefined
        /**
         * Time limits in milliseconds for functions that are slow by design, by a pattern of the
         * function name, such as `[[/Hash\.pbkdf2$/, 20_000]]`. The first match applies.
         * Defaults to none.
         */
        slow?: readonly (readonly [RegExp, number])[] | undefined
      }
    | undefined
  /**
   * The parts of the library its users lean on most, named as the metrics name them, such as
   * `lib:Math.add` or `lib/Math`. Each script repeats its lines about them as `hot-<metric>`
   * lines.
   */
  hot?: readonly string[] | undefined
  /**
   * The specifiers of dependencies that an entry re-exports, such as `dep/mini`. Their values and
   * types belong to the dependency, so the footprint and types scripts leave them out. Defaults to
   * none.
   */
  reexports?: readonly string[] | undefined
  /** The directory of the sources, relative to the root. Defaults to `src`. */
  source?: string | undefined
  /** Inputs of the speed script, which records the calls the project's vitest tests make. */
  speed?:
    | {
        /**
         * Prepares what the tests reach while the calls are recorded, such as a local node, and
         * returns the variables to add to the environment of vitest and a function that stops it.
         * Receives the directory the recording is cached in. Defaults to nothing.
         */
        environment?:
          | ((cache: string) => Promise<{
              env?: Record<string, string> | undefined
              stop?: (() => void) | undefined
            }>)
          | undefined
        /**
         * Returns the test projects to record from the projects of the project's vitest config,
         * or from its one test config, which arrives as a single project. A returned project
         * keeps `name`, `include`, `exclude`, `environment`, `globalSetup`, and `setupFiles`, and
         * may add test files, such as calls no test makes. Defaults to every project that does
         * not run in a browser.
         */
        projects?:
          | ((projects: readonly SpeedProject[]) => readonly SpeedProject[])
          | undefined
      }
    | undefined
  /** Inputs of the types scripts. */
  types?:
    | {
        /**
         * The type-test files whose tests `bench-instantiations` counts, as a glob relative to the
         * root, such as `src/**\/*.bench-d.ts`. Without it, the metric is skipped.
         */
        benches?: string | undefined
        /**
         * The tsconfig whose options a consumer of the declarations checks with, relative to the
         * root. Defaults to `tsconfig.json`.
         */
        consumerTsconfig?: string | undefined
        /**
         * The tsconfig the type tests check with, whose `paths` can point the package at its
         * sources, relative to the root. Defaults to `tsconfig.json`.
         */
        testTsconfig?: string | undefined
      }
    | undefined
}

/** A test project of the project's vitest config, with the options `speed.projects` reads. */
export type SpeedProject = {
  /** Set when the project runs in a browser, which the recording cannot. */
  browser?: { enabled?: boolean | undefined } | undefined
  /** The vitest environment, such as `node`. */
  environment?: string | undefined
  /** Globs of test files to leave out. */
  exclude?: string[] | undefined
  /** Files that run once before the project's tests. */
  globalSetup?: string | string[] | undefined
  /** Globs of the project's test files, relative to the root. */
  include?: string[] | undefined
  /** The project's name. */
  name?: string | undefined
  /** Files that run before each test file. */
  setupFiles?: string | string[] | undefined
}

/** The project root, which holds package.json. */
export const root = process.cwd()

/**
 * The project's own directory in the vendored pack, `local/`, which `uphill update` keeps and
 * `uphill audit` skips. It holds the project's inputs and the files they name.
 */
export const local = path.resolve(import.meta.dirname, '../local')

/** The file that holds the project's inputs. */
export const configFile = path.join(local, 'config.ts')

/** The project's inputs, or none when it has no `local/config.ts`. */
export const config: Config = fs.existsSync(configFile)
  ? ((await import(pathToFileURL(configFile).href)) as { default: Config })
      .default
  : {}

/** The package.json the library publishes, whose fields a consumer's bundler reads. */
export const manifest = path.join(root, 'package.json')

/** The package name, which names the root entry point. */
export const name = (JSON.parse(fs.readFileSync(manifest, 'utf8')) as Manifest)
  .name

/** The directory of the sources. */
export const sources = path.join(root, config.source ?? 'src')

/** One entry point of the published package. */
export type Entry = {
  /** The built module, such as `dist/Math.js`. */
  file: string
  /** Whether it is an index of namespaces, such as `lib`, rather than one module. */
  index: boolean
  /** The specifier a consumer imports, such as `lib/Math`. */
  name: string
  /** The source module, such as `src/Math.ts`. */
  source: string
  /** The built declarations, such as `dist/Math.d.ts`. */
  types: string
}

type Conditions = {
  default?: string | undefined
  import?: string | undefined
  src?: string | undefined
  types?: string | undefined
}

type Manifest = {
  exports?: string | Record<string, string | Conditions> | undefined
  name: string
}

/**
 * Each entry point: the root entry first, then the other index entries, then the module entries,
 * each in the package's order. A value several entries reach, such as `Math` from `lib` and from
 * `lib/Math`, is named after the first, so an index's namespaces are named `lib:Math` rather than
 * after their own module entry.
 */
export function entries(): Entry[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  ) as Manifest
  const exports =
    typeof manifest.exports === 'string'
      ? { '.': manifest.exports }
      : (manifest.exports ?? {})
  const exclude = new Set(config.exclude ?? [])

  const result: Entry[] = []
  for (const [subpath, target] of Object.entries(exports)) {
    if (exclude.has(subpath) || subpath.includes('*')) continue
    if (subpath.endsWith('package.json')) continue

    const conditions: Conditions =
      typeof target === 'string' ? { default: target } : target
    const file = conditions.import ?? conditions.default
    if (!file?.endsWith('.js') && !file?.endsWith('.mjs')) continue

    const types = conditions.types ?? file.replace(/\.m?js$/, '.d.ts')
    const source = conditions.src ?? sourceOf(path.join(root, file))
    result.push({
      file: path.join(root, file),
      index: path.basename(source).startsWith('index.'),
      name: subpath === '.' ? name : `${name}/${subpath.slice(2)}`,
      source: path.resolve(root, source),
      types: path.join(root, types),
    })
  }
  return order(result)
}

/** Where `build` writes the ES modules. */
export const build = path.join(
  root,
  config.build ??
    (() => {
      const first = entries()[0]
      if (!first) return 'dist'
      return path.relative(root, first.file).split(path.sep)[0]!
    })(),
)

/** Where `build` writes the declarations, beside the modules. */
export const declarations = build

/** The build of a source module, such as `dist/Math.js` for `src/Math.ts`. */
export function built(source: string): string {
  return path.join(
    build,
    path
      .relative(sources, path.resolve(root, source))
      .replace(/\.(m|c)?tsx?$/, '.js'),
  )
}

/** Returns the hot items, which the project lists in `hot`. */
export const hot: ReadonlySet<string> = new Set(config.hot ?? [])

/** The source of a built module, such as `src/Math.ts` for `dist/Math.js`. */
function sourceOf(file: string): string {
  const relative = path.relative(root, file).split(path.sep).slice(1)
  return path.join(
    config.source ?? 'src',
    ...relative.slice(0, -1),
    relative.at(-1)!.replace(/\.m?js$/, '.ts'),
  )
}

/** Puts the root entry first, then the other index entries, then the module entries. */
function order(list: Entry[]): Entry[] {
  const rank = (entry: Entry) => (entry.name === name ? 0 : entry.index ? 1 : 2)
  return list
    .map((entry, i) => [entry, i] as const)
    .sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j)
    .map(([entry]) => entry)
}

/**
 * Writes a `skip` line for each of `metrics` when package.json exports no ES module, as an
 * application does, and returns whether it wrote them. Throws when the entry points exist but the
 * build does not, since every metric reads the build.
 */
export function skip(metrics: readonly string[]): boolean {
  const all = entries()
  if (all.length === 0) {
    const note = '"package.json exports no ES module"'
    fs.appendFileSync(
      process.env.UPHILL_METRICS!,
      metrics.map((metric) => `${metric} skip note ${note}\n`).join(''),
    )
    return true
  }

  const missing = all.find((entry) => !fs.existsSync(entry.file))
  if (missing)
    throw new Error(
      `${path.relative(root, missing.file)} does not exist. Build the package before measuring it.`,
    )
  return false
}
