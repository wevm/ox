/**
 * What the metric scripts need to know about this branch of ox: where the checkout is, where
 * `pnpm build` writes, and which entry points the package publishes. Every other script in this
 * directory is the same on ox's main and 0.x branches, so a change to one applies to both; only
 * this file, the recorded fuzz corpus, the fuzz properties and the extra speed calls differ.
 *
 * On main, the build goes to dist, and package.json's `exports` lists the entry points, each with
 * its source (`src`), declarations (`types`) and build (`default`). `ox/index.docs`, which only
 * feeds the docs generator, and the `_types/*` pattern are left out.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

/** The checkout. */
export const root = path.resolve(import.meta.dirname, '../..')

/** Where `pnpm build` writes the ES modules. */
export const build = path.join(root, 'dist')

/** Where `pnpm build` writes the declarations. */
export const declarations = path.join(root, 'dist')

/** One entry point of the published package. */
export type Entry = {
  /** The built module, such as `dist/core/Hex.js`. */
  file: string
  /** Whether it is an index of namespaces, such as `ox` or `ox/tempo`, rather than one module. */
  index: boolean
  /** The specifier a consumer imports, such as `ox/tempo`. */
  name: string
  /** The source module, such as `src/core/Hex.ts`. */
  source: string
  /** The built declarations, such as `dist/core/Hex.d.ts`. */
  types: string
}

/**
 * Each entry point: `ox` first, then the other index entries, then the module entries, each in the
 * package's order. A value several entries reach, such as `Hex` from `ox` and from `ox/Hex`, is
 * named after the first, so an index's namespaces are named `ox:Hex` rather than after their own
 * module entry.
 */
export function entries(): Entry[] {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  ) as {
    exports: Record<string, { src?: string; types?: string; default?: string }>
  }
  const result: Entry[] = []
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target !== 'object' || !target.default || !target.src) continue
    if (subpath === './index.docs' || subpath.includes('*')) continue
    result.push({
      file: path.join(root, target.default),
      index: path.basename(target.src) === 'index.ts',
      name: subpath === '.' ? 'ox' : `ox/${subpath.slice(2)}`,
      source: path.join(root, target.src),
      types: path.join(root, target.types!),
    })
  }
  return order(result)
}

/** The build of a source module, such as `dist/core/Hex.js` for `src/core/Hex.ts`. */
export function built(source: string): string {
  return path.join(
    build,
    path
      .relative(path.join(root, 'src'), path.resolve(root, source))
      .replace(/\.ts$/, '.js'),
  )
}

/** Puts `ox` first, then the other index entries, then the module entries. */
function order(list: Entry[]): Entry[] {
  const rank = (entry: Entry) => (entry.name === 'ox' ? 0 : entry.index ? 1 : 2)
  return list
    .map((entry, i) => [entry, i] as const)
    .sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j)
    .map(([entry]) => entry)
}

// footprint

/** The package.json ox publishes, whose fields a consumer's bundler reads. */
export const manifest = path.join(root, 'package.json')

// types

/** The tsconfig whose options a consumer of the declarations checks with. */
export const consumerTsconfig = path.join(root, 'src/tsconfig.json')

/**
 * The tsconfig ox's type tests check with, whose `paths` point `ox` and its entries at the sources.
 */
export const testTsconfig = path.join(root, 'test/tsconfig.json')

/**
 * The types metrics' virtual consumer file, where the dependencies that the declarations name, such
 * as `abitype` and `zod`, resolve to the copies ox installs.
 */
export const consumerFile = path.join(root, '__uphill_types_consumer__.mts')

// speed

/**
 * ox's vitest config, which speed-vitest.config.ts reuses. The path is literal, so vitest's config
 * bundler bundles it along.
 */
export async function testConfig() {
  return (await import('../../vite.config.ts')).default
}

/**
 * Calls `onWrite` on every write to one of ox's caches in the build, and returns `Caches.clear`,
 * so the speed bench can empty them before each call. On main, the caches are the members of
 * `caches` in dist/core/internal/caches.js.
 */
export async function trackCaches(onWrite: () => void) {
  const { caches } = await import(path.join(build, 'core/internal/caches.js'))
  for (const cache of Object.values(caches) as {
    set: (...args: unknown[]) => unknown
  }[]) {
    const set = cache.set
    cache.set = function (this: unknown, ...args: unknown[]) {
      onWrite()
      return set.apply(this, args)
    }
  }
  const { clear } = await import(path.join(build, 'core/Caches.js'))
  return clear as () => void
}

// fuzz

/**
 * How a JSON fixture the metrics write, such as fuzz-fixtures/corpus.json, passes the branch's
 * checks: the command that formats it, run from the checkout with the file appended, and the most
 * characters it may hold. On main, vp fmt and vp lint skip .agents/uphill/fuzz-fixtures, so
 * neither applies.
 */
export const fixtures: { format: string[]; maxLength: number } = {
  format: [],
  maxLength: Number.POSITIVE_INFINITY,
}
