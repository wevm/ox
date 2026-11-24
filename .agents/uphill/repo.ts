/**
 * What the metric scripts need to know about this branch of ox: where the checkout is, where
 * `pnpm build` writes, and which entry points the package publishes. Every other script in this
 * directory is the same on ox's main and 0.x branches, so a change to one applies to both; only
 * this file, the recorded fuzz corpus, the fuzz properties and the extra speed calls differ.
 *
 * On 0.x, the build goes to src/_esm and src/_types, and `getExports()` in
 * scripts/utils/exports.ts derives the entry points from src/, as prepublish writes them to
 * src/package.json#exports. `./package.json`, `./index.docs`, which only feeds the docs generator,
 * and the `*.test-d` files that getExports lists are left out.
 *
 * @module
 */

import * as path from 'node:path'

import { getExports } from '../../scripts/utils/exports.ts'

/** The checkout. */
export const root = path.resolve(import.meta.dirname, '../..')

/** Where `pnpm build` writes the ES modules. */
export const build = path.join(root, 'src/_esm')

/** Where `pnpm build` writes the declarations. */
export const declarations = path.join(root, 'src/_types')

/** One entry point of the published package. */
export type Entry = {
  /** The built module, such as `src/_esm/core/Hex.js`. */
  file: string
  /** Whether it is an index of namespaces, such as `ox` or `ox/tempo`, rather than one module. */
  index: boolean
  /** The specifier a consumer imports, such as `ox/tempo`. */
  name: string
  /** The source module, such as `src/core/Hex.ts`. */
  source: string
  /** The built declarations, such as `src/_types/core/Hex.d.ts`. */
  types: string
}

/**
 * Each entry point: `ox` first, then the other index entries, then the module entries, each in the
 * package's order. A value several entries reach, such as `Hex` from `ox` and from `ox/Hex`, is
 * named after the first, so an index's namespaces are named `ox:Hex` rather than after their own
 * module entry.
 */
export function entries(): Entry[] {
  const { dist, src } = getExports()
  const result: Entry[] = []
  for (const [subpath, target] of Object.entries(dist)) {
    if (typeof target === 'string') continue
    if (subpath === './index.docs' || subpath.endsWith('.test-d')) continue
    result.push({
      file: path.join(root, 'src', target.import),
      index: target.types.endsWith('/index.d.ts'),
      name: subpath === '.' ? 'ox' : `ox/${subpath.slice(2)}`,
      source: path.join(root, 'src', src[subpath]!),
      types: path.join(root, 'src', target.types),
    })
  }
  return order(result)
}

/** The build of a source module, such as `src/_esm/core/Hex.js` for `src/core/Hex.ts`. */
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
export const manifest = path.join(root, 'src/package.json')

// types

/** The tsconfig whose options a consumer of the declarations checks with. */
export const consumerTsconfig = path.join(root, 'tsconfig.base.json')

/**
 * The tsconfig ox's type tests check with, whose `paths` point `ox` and its entries at the sources.
 */
export const testTsconfig = path.join(root, 'tsconfig.json')

/**
 * The types metrics' virtual consumer file, where the dependencies that the declarations name, such
 * as `abitype` and `@noble/curves`, resolve to the copies ox ships with.
 */
export const consumerFile = path.join(root, 'src/__uphill_types_consumer__.mts')

// speed

/**
 * ox's vitest config, which speed-vitest.config.ts reuses. The path is literal, so vitest's config
 * bundler bundles it along.
 */
export async function testConfig() {
  return (await import('../../test/vitest.config.ts')).default
}

/**
 * Calls `onWrite` on every write to one of ox's caches in the build, and returns `Caches.clear`,
 * so the speed bench can empty them before each call. On 0.x, every cache is an `LruMap` from
 * src/_esm/core/internal/lru.js.
 */
export async function trackCaches(onWrite: () => void) {
  const { LruMap } = await import(path.join(build, 'core/internal/lru.js'))
  const set = LruMap.prototype.set
  LruMap.prototype.set = function (this: unknown, ...args: unknown[]) {
    onWrite()
    return set.apply(this, args)
  }
  const { clear } = await import(path.join(build, 'core/Caches.js'))
  return clear as () => void
}

// fuzz

/**
 * How a JSON fixture the metrics write, such as fuzz-fixtures/corpus.json, passes the branch's
 * checks: the command that formats it, run from the checkout with the file appended, and the most
 * characters it may hold. On 0.x, `biome check` reads the fixtures, and biome refuses a file over
 * 1 MiB, so they stay well under it.
 */
export const fixtures: { format: string[]; maxLength: number } = {
  format: ['node_modules/.bin/biome', 'format', '--write'],
  maxLength: 800_000,
}
